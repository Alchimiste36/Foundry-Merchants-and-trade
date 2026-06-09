# Merchants, Trades and Transactions

**Merchants, Trades and Transactions** (**MTT**) est un module pour **Foundry VTT** qui ajoute une gestion de marchands, boutiques, services et transactions.

Le module permet de créer des acteurs marchands, d’y organiser un catalogue de produits et de services, puis de gérer les échanges avec les personnages joueurs à travers des sessions de transaction.

MTT est pensé comme un module générique : il peut être configuré pour différents systèmes de jeu grâce à des chemins de données personnalisables et une configuration des monnaies.

---

## Fonctionnalités principales

- Création d’acteurs marchands dédiés.
- Catalogue de produits basé sur des Items Foundry.
- Gestion de services dans la boutique.
- Catégories et sous-catégories de catalogue.
- Produits ou services visibles, masqués ou soumis à validation MJ.
- Clients autorisés avec rail de portraits compact.
- Sessions de transaction par client.
- Achat de produits ou services.
- Vente d’objets du PJ au marchand.
- Ajustement monétaire automatique entre ce que le PJ reçoit et ce qu’il donne.
- Prise en charge de plusieurs monnaies configurables.
- Prix libres et propositions de prix.
- Négociation manuelle par le MJ.
- Validation ou refus d’une transaction complète.
- Livraison des objets achetés sur l’acteur client.
- Gestion des quantités, stocks et piles d’Items à la livraison.
- Informations secrètes réservées au MJ.
- Journal marchand et journal global des transactions.
- Import/export de la configuration du module.

---

## Compatibilité

MTT cible actuellement :

```text
Foundry VTT V14
```

Le module est développé pour rester indépendant d’un système de jeu précis.

Le premier environnement de test utilisé est **Chroniques Oubliées 2**, mais le cœur du module ne dépend pas directement de CO2.

---

## Installation

### Installation manuelle par URL de manifeste

Dans Foundry VTT :

1. Ouvrir **Configuration and Setup**.
2. Aller dans **Add-on Modules**.
3. Cliquer sur **Install Module**.
4. Coller l’URL du manifeste :

```text
https://raw.githubusercontent.com/Alchimiste36/Foundry-Merchants-and-trade/main/module.json
```

5. Installer puis activer le module dans le monde souhaité.

### Installation manuelle par archive

1. Télécharger l’archive du dépôt.
2. Extraire le dossier du module dans le dossier `Data/modules` de Foundry.
3. Vérifier que le dossier du module contient bien `module.json`.
4. Redémarrer Foundry.
5. Activer le module dans le monde souhaité.

---

## Premiers pas

1. Activer le module dans votre monde.
2. Créer un acteur de type **MTT Marchand**.
3. Ouvrir la fiche du marchand.
4. Configurer les monnaies et les chemins utiles pour votre système.
5. Ajouter des produits ou services au catalogue.
6. Autoriser un personnage joueur à commercer avec le marchand.
7. Gérer la session de transaction depuis la fiche marchand.

---

## Configuration

MTT repose sur une configuration adaptable.

La configuration permet notamment de définir :

- les types d’Items autorisés comme produits ;
- les types d’Items autorisés comme services ;
- les chemins de quantité ;
- les chemins de description ;
- les chemins de catégories et sous-catégories ;
- les monnaies, abréviations et taux de conversion ;
- les chemins de prix et de monnaie des Items ;
- les chemins de monnaie des acteurs ;
- les options de livraison et de fusion des Items.

Cette configuration permet d’adapter le module à plusieurs systèmes de jeu sans coder de logique système directement dans le cœur de MTT.

---

## Produits et services

Les **produits** sont basés sur des Items Foundry placés dans le catalogue du marchand.

Les **services** sont des entrées de boutique qui peuvent représenter une prestation, une faveur, une réparation, une location, une information, un accès ou tout autre élément non forcément livré sous forme d’Item.

Un service acheté ne crée pas automatiquement un Item chez l’acheteur. Il est surtout suivi par la session et le journal de transaction.

---

## Sessions de transaction

Chaque client autorisé dispose de sa propre session chez un marchand.

Une session contient deux parties :

```text
Le PJ achète / reçoit
Le PJ vend / donne
```

La monnaie sert d’ajustement automatique entre les deux côtés de l’échange.

Le MJ peut prévisualiser, valider ou refuser une transaction.

---

## Journaux

MTT conserve un historique des transactions :

- dans le journal du marchand ;
- dans un journal global du module.

Les transactions validées et refusées peuvent être consultées selon les droits de l’utilisateur.

Un MJ ou propriétaire du marchand peut voir l’ensemble des transactions du marchand. Un acheteur ne voit que ses propres transactions avec ce marchand.

---

## Informations secrètes

Un produit ou un service peut contenir des informations secrètes réservées au MJ :

- nom secret ;
- prix secret ;
- monnaie secrète ;
- description secrète.

Ces informations peuvent être utilisées pour préparer des objets trompeurs, des défauts cachés, des prix réels ou des détails réservés au MJ.

---

## Développement

Le module utilise JavaScript moderne pour Foundry VTT V14.

Quelques conventions du projet :

- fichiers et dossiers en minuscules ;
- classes CSS préfixées par `mtt-` ;
- localisation via le namespace `mtt` ;
- code JavaScript sans point-virgule superflu ;
- pas de dépendance directe à un système de jeu particulier ;
- pas de dépendance npm ajoutée sans nécessité claire.

---

## Statut

MTT est encore en développement actif.

Certaines fonctionnalités peuvent évoluer, être renommées ou être simplifiées avant une version stable.

---

## Auteur

Module développé par **Alchimiste36**.

Dépôt GitHub :

```text
https://github.com/Alchimiste36/Foundry-Merchants-and-trade
```
