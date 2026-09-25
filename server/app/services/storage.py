from app.core.r2_connection import get_r2_client, R2_BUCKET_NAME


def upload_file(file_bytes: bytes, key: str) -> str:
    client = get_r2_client()
    client.put_object(
        Bucket=R2_BUCKET_NAME,
        Key=key,
        Body=file_bytes,
    )
    return key


def download_file(key: str) -> bytes:
    client = get_r2_client()
    response = client.get_object(Bucket=R2_BUCKET_NAME, Key=key)
    return response["Body"].read()


def delete_file(key: str) -> None:
    get_r2_client().delete_object(Bucket=R2_BUCKET_NAME, Key=key)
