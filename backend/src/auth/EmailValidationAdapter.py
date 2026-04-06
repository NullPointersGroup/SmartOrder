from src.auth.IEmailValidationPort import IEmailValidationPort
import dns.resolver

class EmailValidationAdapter(IEmailValidationPort):
    """
    @brief Adapter verso la validazione DNS del dominio email
    """

    def domain_exists(self, email: str) -> bool:
        """
        @brief controlla che il dominio della mail esiste
        """
        try:
            domain = email.split("@")[1]
            dns.resolver.resolve(domain, "MX", lifetime=3.0)
            return True
        except Exception:
            return False