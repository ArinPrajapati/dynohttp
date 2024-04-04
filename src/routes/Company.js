import {
  ScanCommand,
  PutItemCommand,
  UpdateItemCommand,
  DeleteItemCommand,
  QueryCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { v4 as uuid } from "uuid";
import { db } from "../config/dynamodb.js";
import _ from "lodash";

const getCompany = async (event) => {
  const entityName = event.body ? JSON.parse(event.body).entityName : undefined;
  console.log(entityName);
  if (!entityName) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing entityName in request body" }),
    };
  }
  const params = {
    TableName: "CompanyTable",
    IndexName: "GETBYENTITYS",
    KeyConditionExpression: "ENTITY = :entity",
    ExpressionAttributeValues: {
      ":entity": { S: entityName },
    },
  };
  try {
    const results = await db.send(new QueryCommand(params));
    const companies = results.Items.map((item) => unmarshall(item)); // Unmarshall each item in the array
    return {
      statusCode: 200,
      body: JSON.stringify({ companies }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};

const getEntityByPk = async (event) => {
  const entityName = event.body ? JSON.parse(event.body).entityName : undefined;
  console.log(entityName);
  const pk = event.body ? JSON.parse(event.body).pk : undefined;
  console.log(pk);
  if (!entityName || !pk) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing entityName in request body" }),
    };
  }
  const params = {
    TableName: "CompanyTable",
    IndexName: "GETALLENTITYBYPK",
    KeyConditionExpression: "PK = :pk AND ENTITY = :entity",
    ExpressionAttributeValues: {
      ":entity": { S: entityName },
      ":pk": { S: pk },
    },
  };
  try {
    const results = await db.send(new QueryCommand(params));
    const companies = results.Items.map((item) => unmarshall(item)); // Unmarshall each item in the array
    return {
      statusCode: 200,
      body: JSON.stringify({ companies }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};

const getUserByEmail = async (event) => {
  const email = event.body ? JSON.parse(event.body).email : undefined;

  if (!email) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing email in request body" }),
    };
  }

  const params = {
    TableName: "CompanyTable",
    IndexName: "GETBYEMAIL",
    KeyConditionExpression: "email = :email",
    ExpressionAttributeValues: {
      ":email": { S: email },
    },
  };
  try {
    const results = await db.send(new QueryCommand(params));
    const users = results.Items.map((item) => unmarshall(item)); // Unmarshall each item in the array
    return {
      statusCode: 200,
      body: JSON.stringify({ users }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};

const updateUserEmail = async (event) => {
  try {
    const email = event.body ? JSON.parse(event.body).email : undefined;
    const newEmail = event.body ? JSON.parse(event.body).newEmail : undefined;
    if (!email || !newEmail) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing email in request body" }),
      };
    }
    // find user by email
    const findParams = {
      TableName: "CompanyTable",
      IndexName: "GETBYEMAIL",
      KeyConditionExpression: "email = :email",
      ExpressionAttributeValues: {
        ":email": { S: email },
      },
    };

    const findResult = await db.send(new QueryCommand(findParams));
    if (findResult.Items.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "User not found" }),
      };
    }

    // PK and SK for user from data

    const pk = findResult.Items[0].PK.S;
    const sk = findResult.Items[0].SK.S;

    const params = {
      TableName: "CompanyTable",
      Key: {
        PK: { S: pk },
        SK: { S: sk },
      },
      UpdateExpression: "set email = :newEmail",
      ExpressionAttributeValues: {
        ":newEmail": { S: newEmail },
      },
      ReturnValues: "ALL_NEW",
    };
    const result = await db.send(new UpdateItemCommand(params));
    return {
      statusCode: 200,
      body: JSON.stringify({ result }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};

export { getCompany, getEntityByPk, getUserByEmail, updateUserEmail };
