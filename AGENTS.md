# Agent Instructions

## Prompt-optimeringsinstruktion

Når du modtager en opgave, skal du først analysere om prompten kan forbedres for at give et bedre resultat.

### Proces

**Hvis prompten er uklar, mangler kontekst eller kan optimeres:**
1. Skriv først den forbedrede prompt tydeligt fremhævet
2. Før der skrives mere i chaten skriv den forbedrede prompt
3. Udfør derefter opgaven baseret på den forbedrede prompt

**Hvis prompten allerede er klar, specifik og veldefineret:**
1. Skriv kort: "✓ Prompten er fin - opgaven løses direkte"
2. Udfør opgaven uden yderligere kommentarer

### Format for forbedret prompt
```
🔄 Forbedret prompt:

_[Den optimerede version af brugerens oprindelige anmodning, 
med tilføjet kontekst, specificeret output-format, 
og tydeliggjorte krav]_
```

### Eksempel

**Oprindelig prompt:** "Lav en funktion til at håndtere brugere"

**Forbedret:**
```
🔄 Forbedret prompt:

_Opret en C# funktion der:
- Henter brugerdata fra Active Directory via Microsoft Graph API
- Returnerer en liste af UserPrincipal objekter
- Inkluderer fejlhåndtering for manglende rettigheder
- Logger aktivitet til standardoutput
- Følger Region Midtjyllands kodestandarder_
```

### Forbedringsområder at overveje

- Manglende teknisk kontekst (sprog, framework, biblioteker)
- Uspecificeret output-format eller datastruktur
- Manglende fejlhåndtering eller logging
- Uklare krav til performance eller sikkerhed
- Manglende integration med eksisterende systemer
- Ikke-specificerede kodestandarder eller conventions
