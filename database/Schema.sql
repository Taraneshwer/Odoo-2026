--
-- PostgreSQL database dump
--

\restrict KdN6UWTQ7XpxkaSVc2X4nTK9VaITTbtpKOJTgV70ObqB8uOHlas2GtefhA6zaJM

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

-- Started on 2026-07-12 12:09:32

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 221 (class 1259 OID 16431)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    full_name character varying(255) NOT NULL,
    role character varying(50) NOT NULL,
    phone character varying(20),
    profile_picture character varying(255),
    notification_preferences jsonb DEFAULT '{"sms": false, "push": true, "email": true, "whatsapp": false}'::jsonb,
    last_login timestamp without time zone,
    is_active boolean DEFAULT true,
    email_verified boolean DEFAULT false,
    verification_token character varying(255),
    reset_password_token character varying(255),
    reset_password_expires timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['fleet_manager'::character varying, 'driver'::character varying, 'safety_officer'::character varying, 'financial_analyst'::character varying, 'admin'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 16452)
-- Name: vehicles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vehicles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    registration_number character varying(50) NOT NULL,
    name character varying(255) NOT NULL,
    model character varying(255) NOT NULL,
    make character varying(100) NOT NULL,
    year integer,
    type character varying(100) NOT NULL,
    category character varying(50) DEFAULT 'Commercial'::character varying,
    max_load_capacity numeric(10,2) NOT NULL,
    current_odometer numeric(10,2) DEFAULT 0,
    acquisition_cost numeric(10,2) NOT NULL,
    acquisition_date date,
    fuel_type character varying(50) DEFAULT 'Diesel'::character varying,
    status character varying(50) DEFAULT 'Available'::character varying,
    last_maintenance_date date,
    next_maintenance_due date,
    insurance_expiry date,
    registration_expiry date,
    location_lat numeric(10,8),
    location_lng numeric(11,8),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT vehicles_status_check CHECK (((status)::text = ANY ((ARRAY['Available'::character varying, 'On Trip'::character varying, 'In Shop'::character varying, 'Retired'::character varying])::text[])))
);


ALTER TABLE public.vehicles OWNER TO postgres;

--
-- TOC entry 5055 (class 0 OID 16431)
-- Dependencies: 221
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, password_hash, full_name, role, phone, profile_picture, notification_preferences, last_login, is_active, email_verified, verification_token, reset_password_token, reset_password_expires, created_at, updated_at) FROM stdin;
2d4c26d6-b5e4-461c-baf4-9c8332397def	admin@transitops.com	$2a$10$3HqSz9w7hC8sJ9K9x8F9fO9P9Q9R9S9T9U9V9W9X9Y9Z9A9B9C9D9E	System Admin	admin	\N	\N	{"sms": false, "push": true, "email": true, "whatsapp": false}	\N	t	t	\N	\N	\N	2026-07-12 11:58:17.066452	2026-07-12 11:58:17.066452
\.


--
-- TOC entry 5056 (class 0 OID 16452)
-- Dependencies: 222
-- Data for Name: vehicles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.vehicles (id, registration_number, name, model, make, year, type, category, max_load_capacity, current_odometer, acquisition_cost, acquisition_date, fuel_type, status, last_maintenance_date, next_maintenance_due, insurance_expiry, registration_expiry, location_lat, location_lng, created_at, updated_at) FROM stdin;
286d4ee5-b166-4448-80e5-4a0e78e8a2fb	MH-01-AB-1234	TATA Ace	Ace HT	TATA	2023	Mini Truck	Commercial	500.00	0.00	800000.00	\N	Diesel	Available	\N	\N	\N	\N	\N	\N	2026-07-12 11:58:17.066452	2026-07-12 11:58:17.066452
\.


--
-- TOC entry 4894 (class 2606 OID 16451)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 4896 (class 2606 OID 16449)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 4903 (class 2606 OID 16474)
-- Name: vehicles vehicles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT vehicles_pkey PRIMARY KEY (id);


--
-- TOC entry 4905 (class 2606 OID 16476)
-- Name: vehicles vehicles_registration_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT vehicles_registration_number_key UNIQUE (registration_number);


--
-- TOC entry 4890 (class 1259 OID 16650)
-- Name: idx_users_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_active ON public.users USING btree (is_active);


--
-- TOC entry 4891 (class 1259 OID 16648)
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- TOC entry 4892 (class 1259 OID 16649)
-- Name: idx_users_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_role ON public.users USING btree (role);


--
-- TOC entry 4897 (class 1259 OID 16654)
-- Name: idx_vehicles_location_lat; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_vehicles_location_lat ON public.vehicles USING btree (location_lat);


--
-- TOC entry 4898 (class 1259 OID 16655)
-- Name: idx_vehicles_location_lng; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_vehicles_location_lng ON public.vehicles USING btree (location_lng);


--
-- TOC entry 4899 (class 1259 OID 16652)
-- Name: idx_vehicles_registration; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_vehicles_registration ON public.vehicles USING btree (registration_number);


--
-- TOC entry 4900 (class 1259 OID 16651)
-- Name: idx_vehicles_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_vehicles_status ON public.vehicles USING btree (status);


--
-- TOC entry 4901 (class 1259 OID 16653)
-- Name: idx_vehicles_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_vehicles_type ON public.vehicles USING btree (type);


--
-- TOC entry 4906 (class 2620 OID 16637)
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 4907 (class 2620 OID 16638)
-- Name: vehicles update_vehicles_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON public.vehicles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- Completed on 2026-07-12 12:09:32

--
-- PostgreSQL database dump complete
--

\unrestrict KdN6UWTQ7XpxkaSVc2X4nTK9VaITTbtpKOJTgV70ObqB8uOHlas2GtefhA6zaJM

