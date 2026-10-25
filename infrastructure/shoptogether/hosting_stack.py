"""ST-6 (part 2): private S3 bucket behind CloudFront for the frontend. Created only when `hosting` is true."""

from aws_cdk import CfnOutput, Duration, Stack
from aws_cdk import aws_cloudfront as cloudfront
from aws_cdk import aws_cloudfront_origins as origins
from aws_cdk import aws_s3 as s3
from constructs import Construct

from .config import Config


class HostingStack(Stack):
    def __init__(self, scope: Construct, id: str, *, config: Config, **kwargs) -> None:
        super().__init__(scope, id, **kwargs)

        bucket = s3.Bucket(
            self,
            "SiteBucket",
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            encryption=s3.BucketEncryption.S3_MANAGED,
            enforce_ssl=True,
            removal_policy=config.removal_policy,
            auto_delete_objects=config.is_dev,
        )

        # SPA: unknown paths (e.g. /lists/abc) must serve index.html.
        spa_fallback = [
            cloudfront.ErrorResponse(
                http_status=status,
                response_http_status=200,
                response_page_path="/index.html",
                ttl=Duration.seconds(0),
            )
            for status in (403, 404)
        ]

        distribution = cloudfront.Distribution(
            self,
            "Distribution",
            comment=f"ShopTogether {config.stage}",
            default_root_object="index.html",
            default_behavior=cloudfront.BehaviorOptions(
                origin=origins.S3BucketOrigin.with_origin_access_control(bucket),
                viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                cache_policy=cloudfront.CachePolicy.CACHING_OPTIMIZED,
                compress=True,
            ),
            error_responses=spa_fallback,
            price_class=cloudfront.PriceClass.PRICE_CLASS_100,
        )

        CfnOutput(self, "SiteUrl", value=f"https://{distribution.distribution_domain_name}")
        CfnOutput(self, "BucketName", value=bucket.bucket_name)
        CfnOutput(self, "DistributionId", value=distribution.distribution_id)
