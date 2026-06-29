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
  {
    envName: "S3_BUCKET_NAME",
    outputKeys: ["ProductsBucketName", "productsBucketName"],
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
  const newValues: Record<string, string> = {};

  for (const { envName, outputKeys } of outputMappings) {
    const value = findOutputValue(outputs, outputKeys);

    if (!value) {
      throw new Error(
        `Missing CDK output for ${envName}. Expected one of: ${outputKeys.join(
          ", "
        )}`
      );
    }

    newValues[envName] = value;
  }

  // Load existing env file content if it exists to avoid overwriting manually set keys
  let existingContent = "";
  if (fs.existsSync(envPath)) {
    existingContent = fs.readFileSync(envPath, "utf8");
  }

  const lines = existingContent.split(/\r?\n/);
  const updatedKeys = new Set<string>();
  const newLines = lines.map((line) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      if (key in newValues) {
        updatedKeys.add(key);
        return `${key}=${newValues[key]}`;
      }
    }
    return line;
  });

  // Append any keys that weren't in the existing env file
  for (const envName of Object.keys(newValues)) {
    if (!updatedKeys.has(envName)) {
      if (newLines.length > 0 && newLines[newLines.length - 1].trim() !== "") {
        newLines.push("");
      }
      newLines.push(`${envName}=${newValues[envName]}`);
      updatedKeys.add(envName);
    }
  }

  let finalContent = newLines.join("\n");
  if (!finalContent.endsWith("\n")) {
    finalContent += "\n";
  }

  fs.writeFileSync(envPath, finalContent);
  console.log(`Generated/Updated ${envPath}`);
} catch (error) {
  console.error(
    `Failed to generate .env.local: ${
      error instanceof Error ? error.message : String(error)
    }`
  );
  process.exit(1);
}
