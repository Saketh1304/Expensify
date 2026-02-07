import serverless from "serverless-http";
import app from "./server";

// create serverless wrapper
const serverlessHandler = serverless(app);

// exported lambda function
export const handler = async (event: any, context: any) => {
  // remove API Gateway stage prefix (/Prod)
  if (event.path) {
    event.path = event.path.replace(/^\/Prod/, "");
  }

  return serverlessHandler(event, context);
};
