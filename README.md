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
- [ ] Vérifier que les services restent bloqués proprement tant que leur exécution n'est pas implémentée.
- [ ] Désactiver la fusion étendue et vérifier qu'un Item acteur sans flags MTT reçoit une nouvelle ligne.
- [ ] Activer la fusion étendue et vérifier qu'un Item acteur compatible sans flags MTT reçoit la quantité et les flags MTT sans perdre sa description locale.
- [ ] Vérifier qu'un nom, un type, un sous-type, un prix initial ou une monnaie différente bloque la fusion étendue.
- [ ] Vérifier qu'une fusion étendue complète une pile jusqu'à son maximum puis crée une nouvelle pile pour le reliquat.
