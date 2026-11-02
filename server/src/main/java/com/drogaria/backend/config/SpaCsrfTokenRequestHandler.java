
package com.drogaria.backend.config;

import java.util.function.Supplier;

import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.security.web.csrf.CsrfTokenRequestHandler;
import org.springframework.security.web.csrf.XorCsrfTokenRequestAttributeHandler;
import org.springframework.util.StringUtils;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

public final class SpaCsrfTokenRequestHandler
        implements CsrfTokenRequestHandler {

    private final CsrfTokenRequestHandler xorHandler =
            new XorCsrfTokenRequestAttributeHandler();

    private final CsrfTokenRequestHandler plainHandler =
            new CsrfTokenRequestAttributeHandler();

    @Override
    public void handle(
            HttpServletRequest request,
            HttpServletResponse response,
            Supplier<CsrfToken> csrfToken) {

        this.xorHandler.handle(request, response, csrfToken);

        // Garante que o token seja gerado e disponibilizado.
        csrfToken.get();
    }

    @Override
    public String resolveCsrfTokenValue(
            HttpServletRequest request,
            CsrfToken csrfToken) {

        String headerValue =
                request.getHeader(csrfToken.getHeaderName());

        return (StringUtils.hasText(headerValue)
                ? this.plainHandler
                : this.xorHandler)
                .resolveCsrfTokenValue(request, csrfToken);
    }
}
