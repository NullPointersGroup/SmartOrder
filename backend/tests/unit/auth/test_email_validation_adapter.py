from unittest.mock import patch
import pytest

from src.auth.EmailValidationAdapter import EmailValidationAdapter


@pytest.fixture
def adapter():
    return EmailValidationAdapter()


class TestEmailDomainExists:
    #TU_19
    def test_returns_true_when_mx_record_found(self, adapter):
        with patch("src.auth.EmailValidationAdapter.dns.resolver.resolve"):
            assert adapter.domain_exists("test@test.com") is True

    #TU_20
    def test_returns_false_when_mx_record_not_found(self, adapter):
        with patch("src.auth.EmailValidationAdapter.dns.resolver.resolve", side_effect=Exception()):
            assert adapter.domain_exists("test@invalid-domain.xyz") is False

    #TU_21
    def test_extracts_domain_from_email(self, adapter):
        with patch("src.auth.EmailValidationAdapter.dns.resolver.resolve") as mock_resolve:
            adapter.domain_exists("user@example.com")
            mock_resolve.assert_called_once_with("example.com", "MX", lifetime=3.0)