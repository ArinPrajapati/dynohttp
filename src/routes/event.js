export async function handler(event) {
  try {
    // Process each record in the DynamoDB stream
    event.Records.map((record) => {
      console.log("Stream record:", record);
    });

    return;
  } catch (error) {
    console.error("Error processing stream records:", error);
    return;
  }
}
