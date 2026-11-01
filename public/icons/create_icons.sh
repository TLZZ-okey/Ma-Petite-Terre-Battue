#!/bin/bash
# Créer des icônes basiques avec ImageMagick

# Couleurs
OCRE="#F5A623"
VERT="#00A651"
FOND="#F8F4E8"

# Tailles
for size in 72 96 128 144 152 192 384 512; do
    # Créer une image vide
    convert -size ${size}x${size} xc:"$FOND" icon-${size}x${size}.png
    
    # Ajouter un cercle ocre au centre
    convert icon-${size}x${size}.png \
        -fill "$OCRE" \
        -draw "circle $(($size/2)),$(($size/2)) $(($size/2)),$(($size/3))" \
        icon-${size}x${size}.png
    
    # Ajouter un rectangle vert pour le manche de la raquette
    handle_width=$(($size/6))
    handle_height=$(($size/2))
    handle_x1=$(($size/2 - $handle_width/2))
    handle_y1=$(($(($size/2)) + $(($size/3)) + 10))
    handle_x2=$(($size/2 + $handle_width/2))
    handle_y2=$(($handle_y1 + $handle_height))
    
    convert icon-${size}x${size}.png \
        -fill "$VERT" \
        -draw "rectangle $handle_x1,$handle_y1 $handle_x2,$handle_y2" \
        icon-${size}x${size}.png
    
    # Ajouter un cercle vert pour la tête de la raquette
    head_radius=$(($size/4))
    convert icon-${size}x${size}.png \
        -fill none \
        -stroke "$VERT" \
        -strokewidth 3 \
        -draw "circle $(($size/2)),$(($size/2 - $size/6)) $(($size/2)),$(($size/2 - $size/6 + $head_radius))" \
        icon-${size}x${size}.png
    
done

echo "Icônes créées avec succès !"
