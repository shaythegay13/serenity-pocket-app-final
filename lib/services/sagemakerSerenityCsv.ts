import { SageMakerRuntimeClient, InvokeEndpointCommand } from "@aws-sdk/client-sagemaker-runtime"

export interface SerenityBetProbs {
  pLoss: number
  pPush: number
  pWin: number
}

const SAGEMAKER_SERENITY_REGION = "us-west-2"
// Updated to v4 SageMaker endpoint for Serenity Pocket XGBoost model
const SAGEMAKER_SERENITY_ENDPOINT = "serenity-pocket-xgb-endpoint-v4"

let serenityClient: SageMakerRuntimeClient | null = null

function getSerenityClient(): SageMakerRuntimeClient {
  if (!serenityClient) {
    serenityClient = new SageMakerRuntimeClient({ region: SAGEMAKER_SERENITY_REGION })
  }
  return serenityClient
}

/**
 * Call the Serenity Pocket XGBoost multiclass model over CSV.
 * featuresCsv must be a single CSV row with NO label column, columns in the
 * exact order the model was trained on (all columns after `label`).
 */
export async function predictSerenityBet(featuresCsv: string): Promise<SerenityBetProbs> {
  const client = getSerenityClient()

  const command = new InvokeEndpointCommand({
    EndpointName: SAGEMAKER_SERENITY_ENDPOINT,
    Body: Buffer.from(featuresCsv, "utf-8"),
    ContentType: "text/csv",
    Accept: "text/csv",
  })

  const res = await client.send(command)
  const body = res.Body ? Buffer.from(res.Body as Uint8Array).toString("utf-8") : ""

  // Expect something like: "0.1,0.2,0.7" or "0.1,0.2,0.7\n"
  const line = body.trim().split(/\r?\n/)[0] || ""
  const parts = line.split(",").map((s) => parseFloat(s.trim()))

  const [p0, p1, p2] = parts
  const safe = (v: number | undefined) => (Number.isFinite(v as number) ? (v as number) : 0)

  const pLoss = safe(p0)
  const pPush = safe(p1)
  const pWin = safe(p2)

  console.log("[SageMaker] Serenity CSV probabilities:", { pLoss, pPush, pWin })

  return { pLoss, pPush, pWin }
}
