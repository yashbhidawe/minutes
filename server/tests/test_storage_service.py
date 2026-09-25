from unittest.mock import MagicMock, patch

from app.services.storage import delete_file


def test_delete_file_removes_r2_object():
    client = MagicMock()

    with (
        patch("app.services.storage.get_r2_client", return_value=client),
        patch("app.services.storage.R2_BUCKET_NAME", "minute-ai"),
    ):
        delete_file("7/12/audio.webm")

    client.delete_object.assert_called_once_with(
        Bucket="minute-ai",
        Key="7/12/audio.webm",
    )
