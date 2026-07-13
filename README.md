<h1>Merchants, Trades and Transactions</h1>

**Merchants, Trades and Transactions** (**MTT**) est un module pour **Foundry VTT** qui ajoute une gestion de marchands, boutiques, services et transactions.

Le module permet de créer deux types d'acteurs MTT : des marchands et des stockages.
Les marchands permettent de gérer un catalogue de produits et de services, les trier dans des catégories, modifier leurs informations (nom, prix, monnaies, quantité...), masquer/révéler chaque article ou catégorie...
Les stockages permettent de ranger des produits dans des catégories, récupérer ou déposer des objets et de la monnaie, ajouter des tags sur les objets, masquer/révéler un objet ou une catégorie...

MTT est pensé comme un module générique : il peut être configuré pour différents systèmes de jeu grâce à des chemins de données personnalisables et une configuration des monnaies.
La possibilité d'exporter et d'importer les options de configuration permet de partager les réglages d'un système de jeu facilement.

<p align="center">
  <img src="./assets/mtt-shop-preview.webp" style="height:500px;"> <img src="./assets/mtt-storage-preview.webp" style="height:500px;">
</p>

<h2>Fonctionnalités principales</h2>
<ul>
<li>Conversion d’un acteur système normal en boutique ou en stockage MTT.</li>
<li>Catalogue de produits basé sur des Items Foundry.</li>
<li>Gestion de services dans la boutique.</li>
<li>Catégories et sous-catégories de catalogue.</li>
<li>Produits ou services visibles, masqués ou soumis à validation MJ.</li>
<li>Clients autorisés avec rail de portraits compact.</li>
<li>Sessions de transaction par client.</li>
<li>Achat de produits ou services.</li>
<li>Vente d’objets du PJ au marchand.</li>
<li>Ajustement monétaire automatique entre ce que le PJ reçoit et ce qu’il donne.</li>
<li>Prise en charge de plusieurs monnaies configurables.</li>
<li>Prix libres et propositions de prix.</li>
<li>Négociation manuelle par le MJ.</li>
<li>Validation ou refus d’une transaction complète.</li>
<li>Livraison des objets achetés sur l’acteur client.</li>
<li>Gestion des quantités, stocks et piles d’Items à la livraison.</li>
<li>Informations secrètes réservées au MJ.</li>
<li>Journal marchand et journal global des transactions.</li>
<li>Import/export de la configuration du module.</li>
</ul>

---

## Compatibilité

MTT cible actuellement : Foundry VTT V14

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
- les options de livraison et de fusion des Items ;
- les permissions pour chaque droits de visibilité sur l'acteur MTT ;
- les catégories personnalisées pour les Boutiques et pour les Stockage ;
- d'exporter ou d'importer les options de configuration afin de les partager avec d'autres MJ ou de configurer le module rapidement dans un nouveau monde.

Cette configuration permet d’adapter le module à plusieurs systèmes de jeu sans coder de logique système directement dans le cœur de MTT.

---

## Les Boutiques MTT

Les acteurs convertis en Boutique permettent de simuler un marchand, un magasin, une échope... pour votre système de jeu. Les sessions de transactions permettent d'acheter, de vendre, de proposer un prix, de négocier... avec le marchand. Il reste uniquement après à valider ou refuser la session de transaction.

### Création d'une boutique MTT :

- Le MJ converti un acteur autorisé en Boutique MTT
- il modifie le nom de la boutique, son image, le nom du marchand et son image

Dans les onglets Produits et Services :

- il ajoute par glisser-déposer des Objets de Foundry dans le cataloque des produits et des services
- il ajuste les quantités pour chaque produit
- il détermine si les clients voient l'objet en mode limité ou observateur
- il ajoute (si besoin) des informations secrètes
- il modifie le nom, l'image ou le prix des produits
- il ajoute des catégories personnalisées
- il déplace par glisser-déposer les produits dans des catégories
- il masque ou révèle les produits, les services ou les catégories pour les clients
- il ajoute une demande d'approbation pour certain produits au besoin

Dans l'onglet Configuration :

- le MJ écrit un description de la boutique et du marchand
- il détermine les pourcentages de vente et d'achat généraux de la boutique par rapport aux prix initiaux des objets
- il ajoute une formule pour le jet de négociation du marchand ( exemple : /roll 1d20+8 )
- il ajuste la trésorerie de la boutique
- et enfin, il peut enregistrer l'état de la boutique quand il a terminé pour réinitialiser la boutique facilement.

### Session de transaction :

Grâce au rail des clients, le MJ peut ajouter des acteurs sur la boutique et leur ouvrir une session de transaction. En fonction des permissions pour chaque droit sur la boutique, les joueurs pourront :

- ajouter des produits et des services du marchand vers leur session de transaction
- ajouter des objets de leurs inventaires dans la session
- modifier le prix de vente ou d'achat des produits et des services ajoutés à leur session pour déclencher une négociation
- ajuster les quantités vendues ou achetées depuis leur session de transaction
- visualiser la transaction
- Soumettre sa session de transaction pour le MJ.

Quand une session de transaction est validée, les objets sont transférés du marchand vers le client et du client vers le marchand. Les objets qui sont achetés à la Boutique peuvent recevoir dans leurs descriptions une ligne d'informations pour savoir durant quelle transaction cet objet à été acheté et à qui. Les informations secrètes de l'objet pourront être écrit dans un champ spécifique de l'objet.

---

## Les Stockages MTT

Les acteurs convertis en Stockage MTT permettent de simuler un coffre trouvé dans un donjon, une réserve personnelle d'un personnage, un stockage commun pour le groupe de joueur, un butin récupéré sur un groupe d'ennemis... Les sessions d'Échange permettent de récupérer ou de déposer des objets ou de la trésorerie.

### Création d'un Stockage MTT

- Le MJ converti un acteur autorisé en Stockage MTT
- il modifie le nom et l'image du stockage

Dans l'onglet Produits :

- il ajoute par glisser-déposer des Objets Foundry autorisés
- il modifie le nom, l'image ou le prix des Objets
- il modifie la quantité de l'objet dans le stockage
- il règle la visibilité de l'objet entre limité et observateur
- il bloque certains objets afin d'en limiter leur récupération
- il peut ajouter une option pour être averti lors de la récuépration d'un objet
- il masque ou révèle les objets
- il déplace par glisser-déposer des objets dans des catégories
- il crée de nouvelles catégories personnalisées

Dans l'onglet Configuration :

- il peut autoriser certains acteurs du rail à marchander avec une Boutique MTT au nom du stockage
- il ajuste l'argent présent dans le stockage

### Session d'Échange

Grâce au rail des clients, le MJ peut ajouter par glisser-déposer des acteurs qui pourront interagir avec le Stockage. Dans leur session d'Échange, les acteurs pourront récupérer des objets ou de la monnaie depuis le staockage et déposer des objets ou de la monnaie vers le stockage depuis leur inventaire par glisser-déposer.
La session d'Échange peut être soumise au MJ pour qu'il l'a valide ou la refuse.

---

## Autres fonctionnalités

### Journaux des Acteurs MTT et journaux globaux

Chaque transaction ou Échange validés ou réfusés est enregistré dans les journaux de transaction ou d'Échange sur la feuille de l'Acteur MTT et dans les journaux globaux des transactions ou des Échanges afin de filtrer et trier les sessions ayant été faites pour les Boutiques et les Stockages. Les journaux permettent de garder en mémoire qui a acheté/vendu/récupéré/déposé quoi à quelle Boutique et quel Stockage et de trier les sessions par acteurs, statut validée ou refusée, par prix total de la transaction...

### Rail des acteurs

Sur le bord de la feuille d'un acteur MTT, un rail permet de gérer les "clients" pour la Boutique ou le Stockage.
En glissant-déposant un acteur autorisé sur la feuille MTT, il est ajouté au rail et le MJ peut ouvrir une session de transaction ou d'échange. Le MJ peut aussi retirer l'autorisation de l'acteur ou le supprimer du rail avec un clic droit sur l'image de l'acteur. Depuis le rail, le MJ peut aussi ouvrir rapidement la feuille de l'acteur et gérer des pourcentages personnalisés de chaque acteur.

### Ouverture/fermeture

Une icône de l'entête permet d'autoriser ou de restreindre les transactions sur les Boutiques ou les Stockages. En fermant l'acteur MTT, les joueurs ne pourront plus interagir avec la Boutique ou le Stockage tant que le MJ n'aura pas "ouvert" l'acteur MTT.

### Jet de négociation

Pour les Boutique MTT, le MJ peut facilement écrire un formule de jet de dé pour effectuer un jet de négociation envoyé dans le chat et ainsi estimer le marchandage du gérant de la boutique. Cette fonctionnalité permet au MJ de simuler très efficacement la négociation du marchand avec les clients.

## Auteur

Module développé par **Alchimiste36**.

Dépôt GitHub :

```text
https://github.com/Alchimiste36/Foundry-Merchants-and-trade
```
