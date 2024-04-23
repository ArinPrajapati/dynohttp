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
import { _200, _400, _500 } from "../utils/Response.js";

const getCompany = async (event) => {
  const entityName = event.body ? JSON.parse(event.body).entityName : undefined;
  console.log(entityName);
  if (!entityName) {
    return _400({ error: "Missing entityName in request body" });
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
    return _500({ error: error.message });
  }
};

const getEntityByPk = async (event) => {
  const entityName = event.body ? JSON.parse(event.body).entityName : undefined;
  console.log(entityName);
  const pk = event.body ? JSON.parse(event.body).pk : undefined;
  console.log(pk);
  if (!entityName || !pk) {
    return _400({ error: "Missing entityName or pk in request body" });
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
    return _200({ companies });
  } catch (error) {
    return _500({ error: error.message });
  }
};

const getUserByEmail = async (event) => {
  const email = event.body ? JSON.parse(event.body).email : undefined;

  if (!email) {
    return _400({ error: "Missing email in request body" });
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
    return _200({ users });
  } catch (error) {
    return _500({ error: error.message });
  }
};

const updateUserEmail = async (event) => {
  try {
    const email = event.body ? JSON.parse(event.body).email : undefined;
    const newEmail = event.body ? JSON.parse(event.body).newEmail : undefined;
    if (!email || !newEmail) {
      return _400({ error: "Missing email or newEmail in request body" });
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
      return _400({ error: "User not found" });
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
    return _200({ result });
  } catch (error) {
    return _500({ error: error.message });
  }
};

export { getCompany, getEntityByPk, getUserByEmail, updateUserEmail };
