CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE TYPE TipoUmEnum AS ENUM ('P', 'L', 'K', 'C');
CREATE TYPE MittenteEnum AS ENUM ('Utente', 'Chatbot');

--  AnaArt
CREATE TABLE anaart (
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

--  UtentiWeb
CREATE TABLE utentiweb (
    username    VARCHAR(24)  PRIMARY KEY,
    email       VARCHAR(255) UNIQUE,
    password    VARCHAR(60) NOT NULL,
    admin       BOOLEAN
);

--  Ordine
CREATE TABLE ordine (
    id_ord      INTEGER      PRIMARY KEY,
    username    VARCHAR(24)  NOT NULL,
    data        DATE,
    CONSTRAINT fk_ordine_utentiweb
        FOREIGN KEY (username) REFERENCES utentiweb(username)
);

--  OrdCliDet
CREATE TABLE ordclidet (
    id_ord       INTEGER      NOT NULL,
    cod_art      VARCHAR(13)  NOT NULL,
    qta_ordinata FLOAT,
    PRIMARY KEY (id_ord, cod_art),
    CONSTRAINT fk_ordclidet_ordine
        FOREIGN KEY (id_ord) REFERENCES ordine(id_ord),
    CONSTRAINT fk_ordclidet_anaart
        FOREIGN KEY (cod_art) REFERENCES anaart(cod_art)
);

--  Conversazioni
CREATE TABLE conversazioni (
    id_conv     SERIAL       PRIMARY KEY,
    username    VARCHAR(24)  NOT NULL,
    titolo      VARCHAR(24)  NOT NULL,
    CONSTRAINT fk_conversazioni_utentiweb
        FOREIGN KEY (username) REFERENCES utentiweb(username)
);

--  Messaggi
CREATE TABLE messaggi (
    id_conv      INTEGER      NOT NULL,
    id_messaggio SERIAL,
    mittente     MittenteEnum NOT NULL,
    contenuto    TEXT         NOT NULL,
    PRIMARY KEY (id_conv, id_messaggio),
    CONSTRAINT fk_messaggi_conversazioni
        FOREIGN KEY (id_conv) REFERENCES conversazioni(id_conv) ON DELETE CASCADE
);

--  Carrello
CREATE TABLE carrello (
    username    VARCHAR(24)  NOT NULL,
    cod_art     VARCHAR(13)  NOT NULL,
    quantita    INTEGER,
    PRIMARY KEY (username, cod_art),
    CONSTRAINT fk_carrello_utentiweb
        FOREIGN KEY (username) REFERENCES utentiweb(username),
    CONSTRAINT fk_carrello_anaart
        FOREIGN KEY (cod_art) REFERENCES anaart(cod_art)
);

--  Indici
CREATE INDEX idx_anaart_des_art_trgm
    ON anaart USING GIN (des_art gin_trgm_ops);

CREATE INDEX idx_ordclidet_id_ord   ON ordclidet(id_ord);
CREATE INDEX idx_ordclidet_cod_art  ON ordclidet(cod_art);
CREATE INDEX idx_ordine_username    ON ordine(username);
CREATE INDEX idx_conversazioni_username ON conversazioni(username);
CREATE INDEX idx_messaggi_id_conv   ON messaggi(id_conv);
CREATE INDEX idx_carrello_username  ON carrello(username);