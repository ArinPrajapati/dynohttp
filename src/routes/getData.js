import {
  ScanCommand,
  PutItemCommand,
  UpdateItemCommand,
  DeleteItemCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { v4 as uuid } from "uuid";
import { db } from "../config/dynamodb.js";

const getUserByTask = async (event) => {
  try {
    const task = event.pathParameters.task;
    console.log(task);
    if (!task) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing task" }),
      };
    }
    const userData = await db.send(
      new ScanCommand({
        TableName: "User",
        FilterExpression: "#task = :task",
        ExpressionAttributeNames: { "#task": "task" },
        ExpressionAttributeValues: { ":task": { S: task } },
      })
    );
    console.log(userData, "userData");
    if (userData.Items.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "User not found" }),
      };
    }
    const users = userData.Items.map((item) => unmarshall(item)); // Unmarshall each item in the array
    return {
      statusCode: 200,
      body: JSON.stringify({ users }),
    };
  } catch (error) {
    console.error("Error occurred:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" + error.message }),
    };
  }
};

export { getUserByTask };
