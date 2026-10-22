from os import getenv

import boto3
from dotenv import load_dotenv

load_dotenv()

R2_ACCOUNT_ID = getenv("R2_ACCOUNT_ID")
R2_ACCESS_KEY_ID = getenv("R2_ACCESS_KEY_ID")
R2_SECRET_ACCESS_KEY = getenv("R2_SECRET_ACCESS_KEY")
R2_BUCKET_NAME = getenv("R2_BUCKET_NAME")

ENDPOINT_URL = f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com"


def get_r2_client():
    return boto3.client(
        "s3",
        endpoint_url=ENDPOINT_URL,
        aws_access_key_id=R2_ACCESS_KEY_ID,
        aws_secret_access_key=R2_SECRET_ACCESS_KEY,
        region_name="auto",
    )
