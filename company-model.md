# Company Model

## Campuri

| Camp | Tip | Required | Descriere |
|------|-----|----------|-----------|
| id | string | da | Identificator unic |
| company | string | da | Numele companiei |
| brand | string | nu | Brand-ul companiei |
| group | string | nu | Grupul din care face parte |
| status | string | da | Status: activ, suspendat, inactiv, radiat |
| location | array | nu | Lista de locatii |
| website | array | nu | Link-uri website |
| career | array | nu | Link-uri cariere |
| lastScraped | string | nu | Data ultimei colectari |
| scraperFile | string | nu | Fisierul scraper-ului |
