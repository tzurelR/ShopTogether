# ShopTogether Infrastructure (AWS CDK — Python)

CDK app in **Python** deploying **Python 3.12** Lambdas from `../backend`. Region default: **`eu-central-1`**.

## Prerequisites

- Node.js 18+ (`cdk` CLI via `npm install -g aws-cdk`)
- Python 3.12+ 
- AWS CLI configured (`aws configure`)

## Setup

```bash
cd infrastructure
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Stacks

| Stack | Purpose |
|-------|---------|
| `ShopTogether-dev-Database` | DynamoDB single-table |
| `ShopTogether-dev-Auth` | Cognito |
| `ShopTogether-dev-Api` | REST API + Lambdas |
| `ShopTogether-dev-WebSocket` | WebSocket API + stream broadcast |
| `ShopTogether-dev-Frontend` | S3 + CloudFront |
| `ShopTogether-dev-Email` | Placeholder / SES notes |

Change environment: `cdk deploy --all -c env=dev`

## Commands

```bash
cdk ls
cdk synth
cdk bootstrap   # once per account/region
cdk deploy --all
```

## SAM CLI

Not required when using CDK.
