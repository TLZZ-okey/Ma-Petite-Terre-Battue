# Site vitrine — François-Henri Désérable

Site statique (HTML/CSS/JS, sans dépendance ni build).

- `index.html` : carrousel des actualités + derniers livres parus
- `romans.html` : tous les livres, filtrables (romans / récits)
- `biographie.html` : biographie et repères chronologiques
- `presse.html` : revue de presse

## Modifier le contenu

Tout le contenu (actualités, livres, articles) est dans `js/data.js`.

## Ajouter des visuels

Déposez les images dans `images/` puis renseignez le champ `image`
(ex. `image: "images/chagrin.jpg"`) d'une actualité ou d'un livre.
Sans image, le site affiche une couverture typographique générée.
Pour la photo de l'auteur, voir le commentaire dans `biographie.html`.

## Voir le site

Ouvrir `index.html` dans un navigateur, ou :

    python3 -m http.server 8000
