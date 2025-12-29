# EDC tools

[![CI](https://github.com/morbre-tech/EDC-tools/actions/workflows/ci.yml/badge.svg)](https://github.com/morbre-tech/EDC-tools/actions/workflows/ci.yml)

En enkel, statisk landingsside for "EDC tools" bygget med ren HTML og CSS.

## Indhold

- `index.html` – Hovedsiden med layout og indhold.
- `styles.css` – Styling for layout, typografi, komponenter og responsivt design.
- `Dockerfile` – Container definition med nginx
- `.gitea/workflows/` – Gitea Actions workflow til build og deploy

## Kom i gang

### Lokal udvikling
Åbn `index.html` i en browser for at se siden lokalt.

### Deployment workflow

1. **Lokal → GitHub**: Push ændringer til GitHub
   ```bash
   git add .
   git commit -m "Din besked"
   ./deploy.sh
   ```

2. **GitHub → Gitea**: Mirror runner kopierer automatisk fra GitHub til Gitea

3. **Gitea → Podman**: Gitea Actions runner bygger og deployer til Podman
   - Bygger container image med nginx
   - Deployer til `http://localhost:8080`
   - Automatisk cleanup af gamle images

### Manuel deployment
```bash
# Push til GitHub
git push github main

# Eller push til både GitHub og Gitea
git push github main && git push origin main
```

## Struktur

- Sidebar med accordion-menu og brand.
- Hero-sektion med introduktion og primære knapper.
- Kortsektion med oversigt over nøglefunktioner.

## Monitorering

- GitHub: https://github.com/morbre-tech/EDC-tools
- Gitea: https://git.it.rm.dk:3000/morbre/EDC-tools
- Gitea Actions: https://git.it.rm.dk:3000/morbre/EDC-tools/actions
- Deployed site: http://localhost:8080

## Bidrag

Hold ændringer små og læsbare, og test visuelt ved at genindlæse `index.html` i en browser.
