import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, QueryCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from "@aws-sdk/client-apigatewaymanagementapi";

const dynamodb = new DynamoDBClient({ region: "ap-south-1" });
const ddbDocClient = DynamoDBDocumentClient.from(dynamodb);

// Lambda function to handle WebSocket connect event
export const connectHandler = async (event) => {
  const { connectionId } = event.requestContext;
  const { userId, userName } = event.queryStringParameters;
  console.log('e', event, userId, userName);

  try {
    await saveConnectionInfo(userId, connectionId, userName);
    return { statusCode: 200 };
  } catch (error) {
    console.error("Error saving connection info:", error);
  }
};

// Lambda function to handle WebSocket disconnect event
export const disconnectHandler = async (event) => {
  console.log('e', event);
  const { connectionId } = event.requestContext;

  try {
    await deleteConnectionInfo(connectionId);
  } catch (error) {
    console.error("Error deleting connection info:", error);
  }
};

// Lambda function to handle sending messages
export const sendMessageHandler = async (event) => {
  try {
    console.log('e', event);
    const { senderId, receiverId, message } = JSON.parse(event.body);

    console.log('e1', senderId, receiverId, message);
    await saveMessage(senderId, receiverId, message);

    const recipientConnections = await getConnectionIds(receiverId);

    console.log('e2', recipientConnections);

    await notifyRecipient(recipientConnections, {
      senderId,
      message,
    });
    console.log("sent");
    return { "statusCode": 200 };

  } catch (error) {
    console.error("Error sending message:", error);
  }
};

const saveConnectionInfo = async (userId, connectionId, userName) => {
  const params = {
    TableName: "connections",
    Item: {
      UserId: userId,
      ConnectionId: connectionId,
      UserName: userName,
      ConnectedAt: Date.now(),
    },
  };

  await ddbDocClient.send(new PutCommand(params));
};


const deleteConnectionInfo = async (connectionId) => {
  const params = {
    TableName: "connections",
    Key: { ConnectionId: connectionId },
  };

  await ddbDocClient.send(new DeleteCommand(params));
};

const saveMessage = async (senderId, receiverId, message) => {
  const params = {
    TableName: "messages",
    Item: {
      ConversationId: generateConversationId(senderId, receiverId),
      Timestamp: Date.now(),
      SenderId: senderId,
      ReceiverId: receiverId,
      Message: message,
    },
  };
  console.log('p', params);
  await ddbDocClient.send(new PutCommand(params));
};

const generateConversationId = (senderId, receiverId) => {
  const sortedIds = [senderId, receiverId].sort();
  return `${sortedIds[0]}_${sortedIds[1]}`;
};

const getConnectionIds = async (userId) => {
  const params = {
    TableName: "connections",
    IndexName: "UserIdIndex", // Using the GSI for efficient querying by UserId
    KeyConditionExpression: "UserId = :userId",
    ExpressionAttributeValues: { ":userId": userId },
  };

  const { Items } = await ddbDocClient.send(new QueryCommand(params));
  console.log('items', Items);
  return Items.map(item => item.ConnectionId);
};

const notifyRecipient = async (connectionIds, message) => {
  const postData = JSON.stringify(message);

  const endpoint = "https://r4ibwez9od.execute-api.ap-south-1.amazonaws.com/dev";

  const client = new ApiGatewayManagementApiClient({
    apiVersion: "latest",
    endpoint: endpoint,
  });

  const postCalls = connectionIds.map(async (connectionId) => {
    const input = {
      ConnectionId: connectionId,
      Data: postData,
    };

    try {
      const command = new PostToConnectionCommand(input);
      await client.send(command);
      console.log("Notification sent successfully to:", connectionId);
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  });

  await Promise.all(postCalls);

};
