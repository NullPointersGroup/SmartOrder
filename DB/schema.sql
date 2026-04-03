-- DROP indici facoltativo
DROP INDEX IF EXISTS idx_ordclidet_id_ord, idx_ordclidet_cod_art, idx_ordine_username,
                     idx_anaart_des_art_trgm, idx_conversazioni_username,
                     idx_messaggi_id_conv, idx_carrello_username;

-- DROP tabelle
DROP TABLE IF EXISTS carrello, messaggi, conversazioni, ordclidet, ordine, utentiweb, anaart;

-- DROP tipi
DROP TYPE IF EXISTS TipoUmEnum CASCADE;
DROP TYPE IF EXISTS MittenteEnum CASCADE;

-- DROP estensioni
DROP EXTENSION IF EXISTS pg_stat_statements;
DROP EXTENSION IF EXISTS pg_trgm;

-- CREATE estensioni necessarie prima degli indici
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- CREATE ENUM (idempotente, compatibile PostgreSQL <14)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipoumenum') THEN
        CREATE TYPE TipoUmEnum AS ENUM ('P', 'L', 'K', 'C');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'mittenteenum') THEN
        CREATE TYPE MittenteEnum AS ENUM ('Utente', 'Chatbot');
    END IF;
END$$;

-- AnaArt
CREATE TABLE IF NOT EXISTS anaart (
    cod_art         VARCHAR(13)  PRIMARY KEY,
    des_art         VARCHAR(255),
    des_um          VARCHAR(40),
    tipo_um         TipoUmEnum,
    des_tipo_um     VARCHAR(20),
    peso_netto_conf FLOAT,
    conf_collo      FLOAT,
    pezzi_conf      FLOAT,
    grammatura      FLOAT,
    prezzo          DOUBLE PRECISION
);

-- UtentiWeb
CREATE TABLE IF NOT EXISTS utentiweb (
    username    VARCHAR(24)  PRIMARY KEY,
    email       VARCHAR(255) UNIQUE,
    password    VARCHAR(60) NOT NULL,
    admin       BOOLEAN
);

-- Ordine
CREATE TABLE IF NOT EXISTS ordine (
    id_ord      INTEGER      PRIMARY KEY,
    username    VARCHAR(24)  NOT NULL,
    data        DATE,
    CONSTRAINT fk_ordine_utentiweb
        FOREIGN KEY (username) REFERENCES utentiweb(username) ON DELETE CASCADE
);

-- OrdCliDet
CREATE TABLE IF NOT EXISTS ordclidet (
    id_ord       INTEGER      NOT NULL,
    cod_art      VARCHAR(13)  NOT NULL,
    qta_ordinata FLOAT,
    PRIMARY KEY (id_ord, cod_art),
    CONSTRAINT fk_ordclidet_ordine
        FOREIGN KEY (id_ord) REFERENCES ordine(id_ord) ON DELETE CASCADE,
    CONSTRAINT fk_ordclidet_anaart
        FOREIGN KEY (cod_art) REFERENCES anaart(cod_art)
);

-- Conversazioni
CREATE TABLE IF NOT EXISTS conversazioni (
    id_conv     SERIAL       PRIMARY KEY,
    username    VARCHAR(24)  NOT NULL,
    titolo      VARCHAR(24)  NOT NULL,
    CONSTRAINT fk_conversazioni_utentiweb
        FOREIGN KEY (username) REFERENCES utentiweb(username) ON DELETE CASCADE
);

-- Messaggi
CREATE TABLE IF NOT EXISTS messaggi (
    id_conv      INTEGER      NOT NULL,
    id_messaggio SERIAL,
    mittente     MittenteEnum NOT NULL,
    contenuto    TEXT         NOT NULL,
    PRIMARY KEY (id_conv, id_messaggio),
    CONSTRAINT fk_messaggi_conversazioni
        FOREIGN KEY (id_conv) REFERENCES conversazioni(id_conv) ON DELETE CASCADE
);

-- Carrello
CREATE TABLE IF NOT EXISTS carrello (
    username    VARCHAR(24)  NOT NULL,
    cod_art     VARCHAR(13)  NOT NULL,
    quantita    INTEGER,
    PRIMARY KEY (username, cod_art),
    CONSTRAINT fk_carrello_utentiweb
        FOREIGN KEY (username) REFERENCES utentiweb(username) ON DELETE CASCADE,
    CONSTRAINT fk_carrello_anaart
        FOREIGN KEY (cod_art) REFERENCES anaart(cod_art)
);

-- Indici
CREATE INDEX IF NOT EXISTS idx_anaart_des_art_trgm
    ON anaart USING GIN (des_art gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_ordclidet_id_ord   ON ordclidet(id_ord);
CREATE INDEX IF NOT EXISTS idx_ordclidet_cod_art  ON ordclidet(cod_art);
CREATE INDEX IF NOT EXISTS idx_ordine_username    ON ordine(username);
CREATE INDEX IF NOT EXISTS idx_conversazioni_username ON conversazioni(username);
CREATE INDEX IF NOT EXISTS idx_messaggi_id_conv   ON messaggi(id_conv);
CREATE INDEX IF NOT EXISTS idx_carrello_username  ON carrello(username);