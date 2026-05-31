# Foundry-Merchants-and-trade

Module pour foundry VTT pour la gestion de magasin, marchands et transactions

## Livraison des achats sur acteur

Les quantités commerciales du catalogue marchand restent indépendantes des piles d'Items possédées par les acteurs.

La configuration MTT permet de définir :

- `deliveryItemQuantityPath` : chemin de la quantité portée par une pile d'Item livrée à un acteur ;
- `deliveryItemMaxQuantityPath` : chemin de la quantité maximale autorisée par pile sur l'acteur.

Si le chemin de quantité de livraison est vide, MTT utilise le chemin général `itemQuantityPath`. Si le maximum est vide, invalide ou inférieur à `1`, la pile livrée est considérée comme illimitée.

MTT fusionne une livraison uniquement avec une pile acteur qui possède explicitement la même origine MTT et qui ne contient aucune modification commerciale. Une origine absente ou ambiguë crée une nouvelle pile.

L'option `allowExtendedItemMerge`, désactivée par défaut, autorise un fallback contrôlé lorsque cette origine commune est absente. MTT compare alors uniquement le nom, le type, le sous-type configuré, le prix initial et la monnaie. En cas de correspondance, l'Item acteur existant est conservé : seuls sa quantité et ses flags MTT sont mis à jour.

## Checklist manuelle Foundry

- [ ] Acheter un produit avec un stock marchand limité et vérifier sa diminution.
- [ ] Acheter un produit avec un stock marchand illimité et vérifier qu'il reste illimité.
- [ ] Livrer une quantité inférieure au maximum par pile.
- [ ] Livrer une quantité supérieure au maximum et vérifier la création de plusieurs piles acteur.
- [ ] Compléter une pile compatible existante, puis créer une nouvelle pile avec le reliquat.
- [ ] Vérifier qu'une pile sans origine MTT explicite ne fusionne pas.
- [ ] Vérifier qu'une pile modifiée commercialement ne fusionne pas.
- [ ] Vérifier qu'un chemin de quantité de livraison absent bloque proprement la validation.
- [ ] Vérifier qu'un stock marchand insuffisant bloque la validation avant tout transfert.
- [ ] Vérifier qu'une erreur de livraison bloque les transferts monétaires.
- [ ] Vérifier qu'une vente du PJ au marchand fonctionne toujours.
- [ ] Acheter un service illimité avec une quantité vide et vérifier qu'aucun Item n'est créé sur l'acteur acheteur.
- [ ] Acheter un service limité avec un stock de `3`, puis vérifier que son stock passe à `2`.
- [ ] Tenter d'acheter `2` unités d'un service limité à `1` et vérifier que la validation est bloquée sans paiement.
- [ ] Acheter `5` unités d'un service illimité et vérifier que sa quantité reste vide.
- [ ] Configurer le taux produit à `120 %` et le taux service à `100 %`, puis vérifier qu'un produit à `10` vaut `12` et qu'un service à `10` vaut `10`.
- [ ] Configurer le taux service à `150 %`, puis vérifier qu'un service à `10` vaut `15`.
- [ ] Valider un service négocié ou soumis à validation MJ et vérifier que son stock limité diminue sans livrer d'Item.
- [ ] Sélectionner `Prix libre` comme monnaie d'un service et vérifier que la liste n'affiche aucun prix fixe calculé.
- [ ] Ajouter un service à prix libre avec une proposition positive et vérifier que la négociation utilise la monnaie de référence.
- [ ] Configurer le taux service à `150 %`, proposer `20` pour un service à prix libre et vérifier que la session conserve `20`, pas `30`.
- [ ] Refuser successivement une proposition vide, `0`, `-5` ou invalide pour un service à prix libre.
- [ ] Contre-proposer un nouveau prix pour un service à prix libre, l'accepter, puis vérifier que le stock diminue sans livrer d'Item.
- [ ] Vérifier que le MJ ou propriétaire voit le prix minimum indiqué dans une négociation à prix libre.
- [ ] Vérifier qu'un acheteur classique ne voit ni le prix minimum ni une ligne de prix de référence pour une négociation à prix libre.
- [ ] Vérifier qu'une négociation à prix libre sans minimum affiche l'absence de minimum uniquement au MJ ou propriétaire.
- [ ] Vérifier qu'une proposition inférieure au minimum reste négociable et n'est pas refusée automatiquement.
- [ ] Dans une négociation à prix libre, modifier la quantité et vérifier que le total est recalculé sans afficher de pourcentage.
- [ ] Dans une négociation à prix libre, modifier le prix unitaire et vérifier que le total est recalculé.
- [ ] Dans une négociation à prix libre, modifier le total et vérifier que le prix unitaire est recalculé.
- [ ] Proposer puis accepter une offre à prix libre après recalcul et vérifier qu'aucune erreur liée au pourcentage absent ne survient.
- [ ] Vérifier qu'une négociation classique recalcule toujours le pourcentage, le prix unitaire et le total.
- [ ] Désactiver la fusion étendue et vérifier qu'un Item acteur sans flags MTT reçoit une nouvelle ligne.
- [ ] Activer la fusion étendue et vérifier qu'un Item acteur compatible sans flags MTT reçoit la quantité et les flags MTT sans perdre sa description locale.
- [ ] Vérifier qu'un nom, un type, un sous-type, un prix initial ou une monnaie différente bloque la fusion étendue.
- [ ] Vérifier qu'une fusion étendue complète une pile jusqu'à son maximum puis crée une nouvelle pile pour le reliquat.
