import * as fs from "node:fs";
import * as path from "node:path";

type CdkOutputs = Record<string, Record<string, unknown>>;

type OutputMapping = {
  envName: string;
  outputKeys: string[];
};

const scriptDirectory = path.dirname(path.resolve(process.argv[1]));
const outputsPath = path.join(scriptDirectory, "cdk-outputs.json");
const envPath = path.join(scriptDirectory, ".env.local");

const outputMappings: OutputMapping[] = [
  {
    envName: "NEXT_PUBLIC_COGNITO_USER_POOL_ID",
    outputKeys: ["CognitoUserPoolId", "UserPoolId"],
  },
  {
    envName: "NEXT_PUBLIC_COGNITO_CLIENT_ID",
    outputKeys: ["CognitoClientId", "UserPoolClientId"],
  },
  {
    envName: "NEXT_PUBLIC_API_GATEWAY_URL",
    outputKeys: ["ApiGatewayUrl", "ApiUrl"],
  },
];

const findOutputValue = (
  outputs: CdkOutputs,
  outputKeys: string[]
): string | undefined => {
  for (const stackOutputs of Object.values(outputs)) {
    if (!stackOutputs || typeof stackOutputs !== "object") {
      continue;
    }

    for (const outputKey of outputKeys) {
      const value = stackOutputs[outputKey];

      if (typeof value === "string") {
        return value;
      }
    }
  }

  return undefined;
};

try {
  if (!fs.existsSync(outputsPath)) {
    throw new Error(`CDK outputs file not found: ${outputsPath}`);
  }

  const outputs = JSON.parse(fs.readFileSync(outputsPath, "utf8")) as CdkOutputs;
  const envEntries = outputMappings.map(({ envName, outputKeys }) => {
    const value = findOutputValue(outputs, outputKeys);

    if (!value) {
      throw new Error(
        `Missing CDK output for ${envName}. Expected one of: ${outputKeys.join(
          ", "
        )}`
      );
    }

    return `${envName}=${value}`;
  });

  fs.writeFileSync(envPath, `${envEntries.join("\n")}\n`);
  console.log(`Generated ${envPath}`);
} catch (error) {
  console.error(
    `Failed to generate .env.local: ${
      error instanceof Error ? error.message : String(error)
    }`
  );
  process.exit(1);
}
