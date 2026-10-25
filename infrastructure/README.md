# ShopTogether infrastructure (AWS CDK, Python)

Region `eu-central-1`. Every stack is named `ShopTogether-<stage>-<Name>` and tagged `project=shoptogether`, `stage=<stage>`.

| Stack | Ticket | What's in it |
|---|---|---|
| `ShopTogether-dev-Auth` | ST-2 | Cognito user pool (Lite, email + password) and the `web` app client |
| `ShopTogether-dev-Data` | ST-3 | DynamoDB table `shoptogether-dev` (PK/SK, on-demand, TTL `expiresAt`) |
| `ShopTogether-dev-Api` | ST-4, ST-5 | HTTP API + JWT authorizer → `api` Lambda; WebSocket API → `ws` Lambda |
| `ShopTogether-dev-Email` | ST-6 | SES sender identity (only if `senderEmail` is set) |
| `ShopTogether-dev-Hosting` | ST-6 | S3 + CloudFront for the frontend (only if `hosting` is true) |

The Lambda code is the whole `../backend` folder. Handlers: `api.handler.handler` and `ws.handler.handler`.

## Settings (`cdk.json` → `context`)

| Key | Default | Meaning |
|---|---|---|
| `stage` | `dev` | Stack and resource name suffix. `dev` resources are deleted by `cdk destroy`. |
| `appUrl` | `http://localhost:5173` | Frontend URL: used in invite links and allowed by CORS |
| `senderEmail` | `""` | Invite sender address. Setting it adds the Email stack and SES permissions. |
| `hosting` | `false` | `true` adds the Hosting stack |

Override once with `-c key=value`, e.g. `cdk deploy ShopTogether-dev-Api -c appUrl=https://xyz.cloudfront.net`.

## One-time setup

```bash
cd infrastructure
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

export AWS_PROFILE=<your-profile>      # or omit to use the default profile
cdk bootstrap aws://<ACCOUNT_ID>/eu-central-1
```

## Deploy, step by step

Always run with the venv active (`source .venv/bin/activate`). Run `cdk diff <stack>` first to preview changes.

```bash
# Step 1: sign up / log in
cdk deploy ShopTogether-dev-Auth --outputs-file outputs.json

# Step 2-3: lists, items, live updates (deploys Auth and Data first if needed)
cdk deploy ShopTogether-dev-Api --outputs-file outputs.json

# Step 5: set "senderEmail" and "hosting": true in cdk.json, then
cdk deploy ShopTogether-dev-Email ShopTogether-dev-Hosting --outputs-file outputs.json
#   click the verification link SES emails to senderEmail,
#   then set "appUrl" to the SiteUrl output and redeploy the API:
cdk deploy ShopTogether-dev-Api --outputs-file outputs.json
```

Outputs the frontend needs: `UserPoolId`, `UserPoolClientId`, `Region`, `ApiUrl`, `WsUrl` (and `SiteUrl`, `BucketName`, `DistributionId` for hosting).

## Remove everything

```bash
cdk destroy --all
```
