-- Ajouter les informations client dans la table rides
-- Script SQL pour Databricks

-- Ajouter les colonnes client_name et client_phone
ALTER TABLE io_catalog.corail.rides ADD COLUMNS (
  client_name STRING COMMENT 'Nom du client pour cette course',
  client_phone STRING COMMENT 'Numéro de téléphone du client'
);

-- Vérifier que les colonnes ont été ajoutées
DESCRIBE TABLE io_catalog.corail.rides;

