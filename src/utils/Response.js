export function _200(data) {
  return {
    statusCode: 200,
    headers: {
      "Response-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true,
    },
    body: JSON.stringify(data),
  };
}

export function _400(data) {
  return {
    statusCode: 400,
    headers: {
      "Response-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true,
    },
    body: JSON.stringify(data),
  };
}

export function _500(data) {
  return {
    statusCode: 500,
    headers: {
      "Response-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true,
    },
    body: JSON.stringify(data),
  };
}
