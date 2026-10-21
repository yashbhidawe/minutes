from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from app.services.summarization import summarize_transcript


def test_summarization_requests_json_and_parses_response():
    client = MagicMock()
    client.models.generate_content.return_value = SimpleNamespace(
        text='''{
            "title": "Weekly planning",
            "key_decisions": "- Ship Friday",
            "discussion_points": "- Reviewed roadmap",
            "blockers": "",
            "next_steps": "- Prepare release notes",
            "action_items": []
        }'''
    )

    with patch("app.services.summarization.get_client", return_value=client):
        result = summarize_transcript("The team discussed the release.")

    assert result["title"] == "Weekly planning"
    assert result["key_decisions"] == "- Ship Friday"
    assert result["action_items"] == []
    call = client.models.generate_content.call_args
    assert call.kwargs["model"] == "gemini-3.8-flash"
    assert "The team discussed the release." in call.kwargs["contents"]
    assert call.kwargs["config"].response_mime_type == "application/json"
