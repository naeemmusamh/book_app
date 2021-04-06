DROP TABLE IF EXISTS tasks;
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    author character varying(255) NOT NULL,
    title character varying(255) NOT NULL,
    isbn character varying(200) NOT NULL,
    image_url character varying(255) NOT NULL,
    description character varying(5000) NOT NULL
);