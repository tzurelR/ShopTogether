"""The invite email (copy from screen 6), sent with SES. Never raises: the invite is saved either way."""

import html
import logging
import os
from functools import cache

import boto3

from helpers.constants import INVITE_TTL_SECONDS

logger = logging.getLogger(__name__)


@cache
def _client():
    return boto3.client("sesv2")


def _one_line(text: str) -> str:
    # Subjects must not contain line breaks.
    return " ".join(text.split())


def build_invite_email(inviter: str, list_name: str, link: str) -> dict:
    days = INVITE_TTL_SECONDS // 86400
    subject = _one_line(f"{inviter} shared “{list_name}” with you")
    text = (
        f"{inviter} shared “{list_name}” with you on ShopTogether.\n\n"
        f"Open the list to see it and edit it together:\n{link}\n\n"
        f"The link expires in {days} days. If you weren't expecting this, you can ignore this email.\n"
    )
    e_inviter, e_list, e_link = html.escape(inviter), html.escape(list_name), html.escape(link, quote=True)
    body_html = f"""<!doctype html>
<html><body style="margin:0;padding:24px;background:#f5f7f4;font-family:Helvetica,Arial,sans-serif;color:#18211b">
  <table role="presentation" width="100%" style="max-width:480px;margin:0 auto;background:#ffffff;border:1px solid #d3dcd4;border-radius:12px">
    <tr><td style="padding:24px">
      <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#1f7a4d">ShopTogether</p>
      <h1 style="margin:0 0 12px;font-size:20px;line-height:1.3">{e_inviter} shared &ldquo;{e_list}&rdquo; with you</h1>
      <p style="margin:0 0 20px;font-size:15px;line-height:1.5;color:#5b6a60">Open the list to see it and edit it together. The link expires in {days} days.</p>
      <a href="{e_link}" style="display:inline-block;padding:12px 20px;background:#1f7a4d;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:600">Open the list</a>
      <p style="margin:20px 0 0;font-size:12px;color:#5b6a60">Or paste this link into your browser:<br>{e_link}</p>
    </td></tr>
  </table>
</body></html>"""
    return {"subject": subject, "text": text, "html": body_html}


def send_invite_email(to: str, inviter: str, list_name: str, link: str) -> bool:
    """Returns True if SES accepted the email."""
    sender = os.environ.get("SENDER_EMAIL")
    if not sender:
        logger.info("SENDER_EMAIL not set; invite email to %s not sent", to)
        return False
    message = build_invite_email(inviter, list_name, link)
    try:
        _client().send_email(
            FromEmailAddress=f"ShopTogether <{sender}>",
            Destination={"ToAddresses": [to]},
            Content={
                "Simple": {
                    "Subject": {"Data": message["subject"], "Charset": "UTF-8"},
                    "Body": {
                        "Text": {"Data": message["text"], "Charset": "UTF-8"},
                        "Html": {"Data": message["html"], "Charset": "UTF-8"},
                    },
                }
            },
        )
    except Exception:
        logger.exception("Invite email to %s failed", to)
        return False
    return True
