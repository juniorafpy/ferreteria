--
-- PostgreSQL database dump
--

\restrict sXQEQJ7nQZe8OPWFJON4LE2Stt0xrC8kCgXVCcxZPRky5J6BsPfv7cUWSffTJpI

-- Dumped from database version 17.12
-- Dumped by pg_dump version 17.12

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

--
-- Name: drizzle; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA drizzle;


--
-- Name: ambiente_sifen; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.ambiente_sifen AS ENUM (
    'test',
    'produccion'
);


--
-- Name: condicion_operacion; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.condicion_operacion AS ENUM (
    'contado',
    'credito'
);


--
-- Name: estado_cuenta; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.estado_cuenta AS ENUM (
    'pendiente',
    'parcial',
    'pagado',
    'anulado'
);


--
-- Name: estado_documento; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.estado_documento AS ENUM (
    'borrador',
    'confirmado',
    'anulado'
);


--
-- Name: estado_factura_compra; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.estado_factura_compra AS ENUM (
    'borrador',
    'confirmado',
    'recibido_parcial',
    'recibido',
    'anulado'
);


--
-- Name: estado_orden_compra; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.estado_orden_compra AS ENUM (
    'borrador',
    'confirmado',
    'facturado_parcial',
    'facturado',
    'anulado'
);


--
-- Name: estado_pedido_compra; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.estado_pedido_compra AS ENUM (
    'borrador',
    'confirmado',
    'ordenado_parcial',
    'ordenado',
    'anulado'
);


--
-- Name: estado_presupuesto; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.estado_presupuesto AS ENUM (
    'borrador',
    'confirmado',
    'facturado_parcial',
    'facturado',
    'vencido',
    'anulado'
);


--
-- Name: estado_registro; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.estado_registro AS ENUM (
    'activo',
    'inactivo'
);


--
-- Name: estado_sesion_caja; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.estado_sesion_caja AS ENUM (
    'abierta',
    'cerrada'
);


--
-- Name: estado_sifen; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.estado_sifen AS ENUM (
    'no_aplica',
    'pendiente',
    'enviado',
    'aprobado',
    'aprobado_con_observacion',
    'rechazado',
    'cancelado',
    'inutilizado'
);


--
-- Name: estado_transferencia; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.estado_transferencia AS ENUM (
    'borrador',
    'enviado',
    'recibido',
    'anulado'
);


--
-- Name: lado_asiento; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.lado_asiento AS ENUM (
    'debe',
    'haber'
);


--
-- Name: medio_pago; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.medio_pago AS ENUM (
    'efectivo',
    'transferencia',
    'tarjeta',
    'qr'
);


--
-- Name: modalidad_facturacion; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.modalidad_facturacion AS ENUM (
    'electronica',
    'autoimpresor',
    'preimpreso'
);


--
-- Name: operacion_contable; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.operacion_contable AS ENUM (
    'compra',
    'recepcion',
    'venta',
    'costo_venta',
    'cobro',
    'pago',
    'ajuste_merma',
    'ajuste_sobrante',
    'transferencia',
    'diferencia_caja'
);


--
-- Name: origen_descuento; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.origen_descuento AS ENUM (
    'automatico',
    'manual',
    'ninguno'
);


--
-- Name: origen_documento; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.origen_documento AS ENUM (
    'inicial',
    'factura_compra',
    'recepcion',
    'factura_venta',
    'cobro',
    'orden_pago',
    'ajuste_stock',
    'transferencia_stock',
    'sesion_caja',
    'manual'
);


--
-- Name: tipo_ajuste; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tipo_ajuste AS ENUM (
    'merma',
    'sobrante'
);


--
-- Name: tipo_cuenta_contable; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tipo_cuenta_contable AS ENUM (
    'activo',
    'pasivo',
    'patrimonio',
    'ingreso',
    'costo',
    'gasto'
);


--
-- Name: tipo_descuento; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tipo_descuento AS ENUM (
    'porcentaje',
    'monto'
);


--
-- Name: tipo_documento_electronico; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tipo_documento_electronico AS ENUM (
    'factura',
    'autofactura',
    'nota_credito',
    'nota_debito',
    'nota_remision'
);


--
-- Name: tipo_emision; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tipo_emision AS ENUM (
    'normal',
    'contingencia'
);


--
-- Name: tipo_evento_sifen; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tipo_evento_sifen AS ENUM (
    'generacion',
    'envio',
    'consulta',
    'respuesta',
    'cancelacion',
    'inutilizacion',
    'conformidad',
    'disconformidad',
    'desconocimiento',
    'notificacion',
    'error'
);


--
-- Name: tipo_iva; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tipo_iva AS ENUM (
    'iva10',
    'iva5',
    'exenta'
);


--
-- Name: tipo_movimiento_kardex; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tipo_movimiento_kardex AS ENUM (
    'inicial',
    'entrada_compra',
    'salida_venta',
    'ajuste_entrada',
    'ajuste_salida',
    'transferencia_salida',
    'transferencia_entrada',
    'anulacion_venta',
    'anulacion_compra',
    'anulacion_ajuste',
    'anulacion_transferencia'
);


--
-- Name: tipo_tarjeta; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tipo_tarjeta AS ENUM (
    'credito',
    'debito'
);


--
-- Name: tipo_transaccion; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tipo_transaccion AS ENUM (
    'venta_mercaderia',
    'prestacion_servicios',
    'mixto',
    'venta_activo_fijo',
    'anticipo',
    'otros'
);


--
-- Name: fn_append_only(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_append_only() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  RAISE EXCEPTION 'La tabla % es append-only: % no permitido', TG_TABLE_NAME, TG_OP
    USING ERRCODE = 'restrict_violation';
END;
$$;


--
-- Name: fn_prohibir_borrado_confirmado(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_prohibir_borrado_confirmado() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF OLD.estado::text <> 'borrador' THEN
    RAISE EXCEPTION 'No se puede eliminar % id=% en estado %; use anulación', TG_TABLE_NAME, OLD.id, OLD.estado
      USING ERRCODE = 'restrict_violation';
  END IF;
  RETURN OLD;
END;
$$;


--
-- Name: fn_validar_partida_doble(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_validar_partida_doble() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_asiento_id integer;
  v_estado text;
  v_total_debe bigint;
  v_total_haber bigint;
  v_sum_debe bigint;
  v_sum_haber bigint;
  v_lineas integer;
BEGIN
  IF TG_TABLE_NAME = 'asientos_contables' THEN
    v_asiento_id := NEW.id;
  ELSIF TG_OP = 'DELETE' THEN
    v_asiento_id := OLD.asiento_id;
  ELSE
    v_asiento_id := NEW.asiento_id;
  END IF;

  SELECT estado::text, total_debe_gs, total_haber_gs
    INTO v_estado, v_total_debe, v_total_haber
    FROM asientos_contables WHERE id = v_asiento_id;

  IF NOT FOUND OR v_estado <> 'confirmado' THEN
    RETURN NULL;
  END IF;

  SELECT coalesce(sum(debe_gs), 0), coalesce(sum(haber_gs), 0), count(*)
    INTO v_sum_debe, v_sum_haber, v_lineas
    FROM detalles_asiento_contable WHERE asiento_id = v_asiento_id;

  IF v_lineas < 2 OR v_sum_debe <> v_sum_haber OR v_sum_debe <> v_total_debe OR v_sum_haber <> v_total_haber THEN
    RAISE EXCEPTION 'Asiento % no cumple partida doble (lineas=%, debe=%, haber=%, cabecera=%/%)',
      v_asiento_id, v_lineas, v_sum_debe, v_sum_haber, v_total_debe, v_total_haber
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NULL;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: __drizzle_migrations; Type: TABLE; Schema: drizzle; Owner: -
--

CREATE TABLE drizzle.__drizzle_migrations (
    id integer NOT NULL,
    hash text NOT NULL,
    created_at bigint
);


--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE; Schema: drizzle; Owner: -
--

CREATE SEQUENCE drizzle.__drizzle_migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: drizzle; Owner: -
--

ALTER SEQUENCE drizzle.__drizzle_migrations_id_seq OWNED BY drizzle.__drizzle_migrations.id;


--
-- Name: actividades_economicas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.actividades_economicas (
    id integer NOT NULL,
    codigo character varying(10) NOT NULL,
    descripcion character varying(255) NOT NULL,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    actualizado_en timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: actividades_economicas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.actividades_economicas ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.actividades_economicas_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: ajuste_stock_detalles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ajuste_stock_detalles (
    id integer NOT NULL,
    empresa_id integer NOT NULL,
    sucursal_id integer NOT NULL,
    ajuste_stock_id integer NOT NULL,
    linea smallint NOT NULL,
    articulo_id integer NOT NULL,
    cantidad numeric(14,3) DEFAULT 0 NOT NULL,
    cantidad_sistema numeric(14,3),
    costo_unitario_gs bigint DEFAULT 0 NOT NULL,
    total_costo_gs bigint DEFAULT 0 NOT NULL,
    observacion character varying(255),
    CONSTRAINT ajuste_stock_detalles_cant CHECK (((cantidad > (0)::numeric) AND (costo_unitario_gs >= 0) AND (total_costo_gs >= 0)))
);


--
-- Name: ajuste_stock_detalles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.ajuste_stock_detalles ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.ajuste_stock_detalles_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: ajustes_stock; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ajustes_stock (
    id integer NOT NULL,
    empresa_id integer NOT NULL,
    sucursal_id integer NOT NULL,
    numero integer NOT NULL,
    fecha date NOT NULL,
    deposito_id integer NOT NULL,
    tipo_ajuste public.tipo_ajuste NOT NULL,
    motivo character varying(255) NOT NULL,
    observacion text,
    total_costo_gs bigint DEFAULT 0 NOT NULL,
    estado public.estado_documento DEFAULT 'borrador'::public.estado_documento NOT NULL,
    creado_por integer NOT NULL,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    actualizado_en timestamp with time zone DEFAULT now() NOT NULL,
    confirmado_por integer,
    confirmado_en timestamp with time zone,
    anulado_por integer,
    anulado_en timestamp with time zone,
    motivo_anulacion text
);


--
-- Name: ajustes_stock_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.ajustes_stock ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.ajustes_stock_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: arqueos_caja; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.arqueos_caja (
    id integer NOT NULL,
    empresa_id integer NOT NULL,
    sucursal_id integer NOT NULL,
    sesion_caja_id integer NOT NULL,
    medio_pago public.medio_pago NOT NULL,
    monto_sistema_gs bigint DEFAULT 0 NOT NULL,
    monto_declarado_gs bigint DEFAULT 0 NOT NULL,
    diferencia_gs bigint DEFAULT 0 NOT NULL,
    observacion character varying(255),
    CONSTRAINT arqueos_caja_diferencia CHECK ((diferencia_gs = (monto_declarado_gs - monto_sistema_gs)))
);


--
-- Name: arqueos_caja_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.arqueos_caja ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.arqueos_caja_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: articulo_unidades; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.articulo_unidades (
    id integer NOT NULL,
    empresa_id integer NOT NULL,
    articulo_id integer NOT NULL,
    unidad_medida_id integer NOT NULL,
    factor_conversion numeric(14,3) NOT NULL,
    codigo_barras character varying(50),
    precio_venta_gs bigint,
    es_predeterminada boolean DEFAULT false NOT NULL,
    estado public.estado_registro DEFAULT 'activo'::public.estado_registro NOT NULL,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    actualizado_en timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT articulo_unidades_factor_pos CHECK ((factor_conversion > (0)::numeric))
);


--
-- Name: articulo_unidades_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.articulo_unidades ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.articulo_unidades_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: articulos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.articulos (
    id integer NOT NULL,
    empresa_id integer NOT NULL,
    codigo character varying(30) NOT NULL,
    codigo_barras character varying(50),
    descripcion character varying(200) NOT NULL,
    descripcion_larga text,
    categoria_id integer,
    marca_id integer,
    modelo_id integer,
    unidad_medida_id integer NOT NULL,
    tipo_iva public.tipo_iva DEFAULT 'iva10'::public.tipo_iva NOT NULL,
    precio_venta_gs bigint DEFAULT 0 NOT NULL,
    costo_referencia_gs bigint DEFAULT 0 NOT NULL,
    controla_stock boolean DEFAULT true NOT NULL,
    permite_decimales boolean DEFAULT false NOT NULL,
    stock_minimo numeric(14,3) DEFAULT 0 NOT NULL,
    estado public.estado_registro DEFAULT 'activo'::public.estado_registro NOT NULL,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    actualizado_en timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT articulos_precio_no_neg CHECK (((precio_venta_gs >= 0) AND (costo_referencia_gs >= 0)))
);


--
-- Name: articulos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.articulos ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.articulos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: asientos_contables; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.asientos_contables (
    id integer NOT NULL,
    empresa_id integer NOT NULL,
    sucursal_id integer NOT NULL,
    numero integer NOT NULL,
    fecha date NOT NULL,
    concepto character varying(255) NOT NULL,
    origen_tipo public.origen_documento DEFAULT 'manual'::public.origen_documento NOT NULL,
    origen_id integer,
    asiento_revertido_id integer,
    total_debe_gs bigint DEFAULT 0 NOT NULL,
    total_haber_gs bigint DEFAULT 0 NOT NULL,
    estado public.estado_documento DEFAULT 'borrador'::public.estado_documento NOT NULL,
    creado_por integer NOT NULL,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    actualizado_en timestamp with time zone DEFAULT now() NOT NULL,
    confirmado_por integer,
    confirmado_en timestamp with time zone,
    anulado_por integer,
    anulado_en timestamp with time zone,
    motivo_anulacion text,
    CONSTRAINT asientos_contables_no_neg CHECK ((total_debe_gs >= 0)),
    CONSTRAINT asientos_contables_partida_doble CHECK ((total_debe_gs = total_haber_gs))
);


--
-- Name: asientos_contables_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.asientos_contables ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.asientos_contables_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cajas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cajas (
    id integer NOT NULL,
    empresa_id integer NOT NULL,
    sucursal_id integer NOT NULL,
    codigo character varying(10) NOT NULL,
    nombre character varying(80) NOT NULL,
    punto_expedicion_id integer,
    deposito_id integer,
    estado public.estado_registro DEFAULT 'activo'::public.estado_registro NOT NULL,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    actualizado_en timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: cajas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.cajas ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cajas_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: categorias_articulo; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categorias_articulo (
    id integer NOT NULL,
    empresa_id integer NOT NULL,
    codigo character varying(20) NOT NULL,
    nombre character varying(120) NOT NULL,
    padre_id integer,
    estado public.estado_registro DEFAULT 'activo'::public.estado_registro NOT NULL,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    actualizado_en timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: categorias_articulo_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.categorias_articulo ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.categorias_articulo_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: ciudades; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ciudades (
    id integer NOT NULL,
    departamento_id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    codigo_sifen integer,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    actualizado_en timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: ciudades_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.ciudades ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.ciudades_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: clientes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clientes (
    id integer NOT NULL,
    empresa_id integer NOT NULL,
    persona_id integer NOT NULL,
    codigo character varying(20),
    condicion_pago_id integer,
    limite_credito_gs bigint DEFAULT 0 NOT NULL,
    saldo_gs bigint DEFAULT 0 NOT NULL,
    observacion text,
    estado public.estado_registro DEFAULT 'activo'::public.estado_registro NOT NULL,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    actualizado_en timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT clientes_limite_no_neg CHECK ((limite_credito_gs >= 0))
);


--
-- Name: clientes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.clientes ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.clientes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cobro_detalles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cobro_detalles (
    id integer NOT NULL,
    empresa_id integer NOT NULL,
    sucursal_id integer NOT NULL,
    cobro_id integer NOT NULL,
    cuenta_cobrar_id integer NOT NULL,
    monto_gs bigint DEFAULT 0 NOT NULL,
    CONSTRAINT cobro_detalles_monto_pos CHECK ((monto_gs > 0))
);


--
-- Name: cobro_detalles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.cobro_detalles ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cobro_detalles_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cobro_medios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cobro_medios (
    id integer NOT NULL,
    empresa_id integer NOT NULL,
    sucursal_id integer NOT NULL,
    cobro_id integer NOT NULL,
    medio_pago public.medio_pago NOT NULL,
    monto_gs bigint DEFAULT 0 NOT NULL,
    referencia character varying(100),
    banco character varying(100),
    tipo_tarjeta public.tipo_tarjeta,
    marca_tarjeta character varying(40),
    ultimos_digitos character(4),
    CONSTRAINT cobro_medios_monto_pos CHECK ((monto_gs > 0)),
    CONSTRAINT cobro_medios_referencia CHECK (((medio_pago = 'efectivo'::public.medio_pago) OR (referencia IS NOT NULL))),
    CONSTRAINT cobro_medios_tarjeta CHECK (((medio_pago <> 'tarjeta'::public.medio_pago) OR (tipo_tarjeta IS NOT NULL)))
);


--
-- Name: cobro_medios_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.cobro_medios ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cobro_medios_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cobros; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cobros (
    id integer NOT NULL,
    empresa_id integer NOT NULL,
    sucursal_id integer NOT NULL,
    numero integer NOT NULL,
    fecha timestamp with time zone DEFAULT now() NOT NULL,
    cliente_id integer,
    sesion_caja_id integer NOT NULL,
    total_gs bigint DEFAULT 0 NOT NULL,
    vuelto_gs bigint DEFAULT 0 NOT NULL,
    observacion text,
    estado public.estado_documento DEFAULT 'borrador'::public.estado_documento NOT NULL,
    creado_por integer NOT NULL,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    actualizado_en timestamp with time zone DEFAULT now() NOT NULL,
    confirmado_por integer,
    confirmado_en timestamp with time zone,
    anulado_por integer,
    anulado_en timestamp with time zone,
    motivo_anulacion text,
    CONSTRAINT cobros_montos CHECK (((total_gs >= 0) AND (vuelto_gs >= 0)))
);


--
-- Name: cobros_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.cobros ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cobros_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: condiciones_pago; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.condiciones_pago (
    id integer NOT NULL,
    empresa_id integer NOT NULL,
    codigo character varying(20) NOT NULL,
    nombre character varying(80) NOT NULL,
    condicion public.condicion_operacion NOT NULL,
    dias_plazo smallint DEFAULT 0 NOT NULL,
    cantidad_cuotas smallint DEFAULT 1 NOT NULL,
    dias_entre_cuotas smallint DEFAULT 30 NOT NULL,
    estado public.estado_registro DEFAULT 'activo'::public.estado_registro NOT NULL,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    actualizado_en timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT condiciones_pago_coherente CHECK (((cantidad_cuotas >= 1) AND (dias_plazo >= 0) AND ((condicion = 'credito'::public.condicion_operacion) OR ((cantidad_cuotas = 1) AND (dias_plazo = 0)))))
);


--
-- Name: condiciones_pago_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.condiciones_pago ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.condiciones_pago_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: configuracion_contable; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.configuracion_contable (
    id integer NOT NULL,
    empresa_id integer NOT NULL,
    operacion public.operacion_contable NOT NULL,
    concepto character varying(40) NOT NULL,
    lado public.lado_asiento NOT NULL,
    cuenta_id integer NOT NULL,
    descripcion character varying(255),
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    actualizado_en timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: configuracion_contable_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.configuracion_contable ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.configuracion_contable_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: configuracion_sifen; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.configuracion_sifen (
    id integer NOT NULL,
    empresa_id integer NOT NULL,
    sucursal_id integer,
    ambiente public.ambiente_sifen DEFAULT 'test'::public.ambiente_sifen NOT NULL,
    id_csc character varying(10),
    csc_ref character varying(120),
    certificado_ruta character varying(255),
    certificado_password_ref character varying(120),
    url_ws_recepcion character varying(255),
    url_ws_consulta character varying(255),
    url_qr_base character varying(255),
    envio_por_lote boolean DEFAULT false NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    actualizado_en timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: configuracion_sifen_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.configuracion_sifen ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.configuracion_sifen_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cuentas_cobrar; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cuentas_cobrar (
    id integer NOT NULL,
    empresa_id integer NOT NULL,
    sucursal_id integer NOT NULL,
    cliente_id integer,
    factura_venta_id integer NOT NULL,
    cuota_venta_id integer,
    numero_cuota smallint DEFAULT 1 NOT NULL,
    fecha_vencimiento date NOT NULL,
    monto_gs bigint DEFAULT 0 NOT NULL,
    saldo_gs bigint DEFAULT 0 NOT NULL,
    estado public.estado_cuenta DEFAULT 'pendiente'::public.estado_cuenta NOT NULL,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    actualizado_en timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT cuentas_cobrar_saldo CHECK (((monto_gs > 0) AND (saldo_gs >= 0) AND (saldo_gs <= monto_gs)))
);


--
-- Name: cuentas_cobrar_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.cuentas_cobrar ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cuentas_cobrar_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cuentas_pagar; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cuentas_pagar (
    id integer NOT NULL,
    empresa_id integer NOT NULL,
    sucursal_id integer NOT NULL,
    proveedor_id integer NOT NULL,
    factura_compra_id integer NOT NULL,
    numero_cuota smallint DEFAULT 1 NOT NULL,
    fecha_vencimiento date NOT NULL,
    monto_gs bigint DEFAULT 0 NOT NULL,
    saldo_gs bigint DEFAULT 0 NOT NULL,
    estado public.estado_cuenta DEFAULT 'pendiente'::public.estado_cuenta NOT NULL,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    actualizado_en timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT cuentas_pagar_saldo CHECK (((monto_gs > 0) AND (saldo_gs >= 0) AND (saldo_gs <= monto_gs)))
);


--
-- Name: cuentas_pagar_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.cuentas_pagar ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cuentas_pagar_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cuotas_venta; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cuotas_venta (
    id integer NOT NULL,
    empresa_id integer NOT NULL,
    sucursal_id integer NOT NULL,
    factura_venta_id integer NOT NULL,
    numero_cuota smallint NOT NULL,
    fecha_vencimiento date NOT NULL,
    monto_gs bigint DEFAULT 0 NOT NULL,
    CONSTRAINT cuotas_venta_monto_pos CHECK (((monto_gs > 0) AND (numero_cuota >= 1)))
);


--
-- Name: cuotas_venta_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.cuotas_venta ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cuotas_venta_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: departamentos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.departamentos (
    id integer NOT NULL,
    pais_id integer NOT NULL,
    codigo smallint NOT NULL,
    nombre character varying(80) NOT NULL,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    actualizado_en timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: departamentos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.departamentos ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.departamentos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: depositos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.depositos (
    id integer NOT NULL,
    empresa_id integer NOT NULL,
    sucursal_id integer NOT NULL,
    codigo character varying(20) NOT NULL,
    nombre character varying(120) NOT NULL,
    es_principal boolean DEFAULT false NOT NULL,
    permite_venta boolean DEFAULT true NOT NULL,
    estado public.estado_registro DEFAULT 'activo'::public.estado_registro NOT NULL,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    actualizado_en timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: depositos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.depositos ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.depositos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: descuento_articulos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.descuento_articulos (
    id integer NOT NULL,
    empresa_id integer NOT NULL,
    descuento_id integer NOT NULL,
    articulo_id integer NOT NULL,
    porcentaje numeric(5,2),
    monto_gs bigint,
    cantidad_minima numeric(14,3) DEFAULT 1 NOT NULL,
    tope_gs bigint,
    CONSTRAINT descuento_articulos_valor_rango CHECK ((((porcentaje IS NULL) OR ((porcentaje > (0)::numeric) AND (porcentaje <= (100)::numeric))) AND ((monto_gs IS NULL) OR (monto_gs > 0)) AND ((tope_gs IS NULL) OR (tope_gs > 0)) AND (cantidad_minima > (0)::numeric))),
    CONSTRAINT descuento_articulos_valor_unico CHECK (((porcentaje IS NOT NULL) <> (monto_gs IS NOT NULL)))
);


--
-- Name: descuento_articulos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.descuento_articulos ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.descuento_articulos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: descuento_sucursales; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.descuento_sucursales (
    id integer NOT NULL,
    empresa_id integer NOT NULL,
    descuento_id integer NOT NULL,
    sucursal_id integer NOT NULL
);


--
-- Name: descuento_sucursales_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.descuento_sucursales ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.descuento_sucursales_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: descuentos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.descuentos (
    id integer NOT NULL,
    empresa_id integer NOT NULL,
    codigo character varying(30) NOT NULL,
    nombre character varying(120) NOT NULL,
    descripcion text,
    tipo public.tipo_descuento NOT NULL,
    fecha_desde date NOT NULL,
    fecha_hasta date NOT NULL,
    prioridad smallint DEFAULT 100 NOT NULL,
    acumulable boolean DEFAULT false NOT NULL,
    todas_sucursales boolean DEFAULT false NOT NULL,
    estado public.estado_registro DEFAULT 'activo'::public.estado_registro NOT NULL,
    creado_por integer NOT NULL,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    actualizado_en timestamp with time zone DEFAULT now() NOT NULL,
    confirmado_por integer,
    confirmado_en timestamp with time zone,
    anulado_por integer,
    anulado_en timestamp with time zone,
    motivo_anulacion text,
    CONSTRAINT descuentos_prioridad_pos CHECK ((prioridad >= 1)),
    CONSTRAINT descuentos_vigencia CHECK ((fecha_hasta >= fecha_desde))
);


--
-- Name: descuentos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.descuentos ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.descuentos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: detalles_asiento_contable; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.detalles_asiento_contable (
    id integer NOT NULL,
    empresa_id integer NOT NULL,
    sucursal_id integer NOT NULL,
    asiento_id integer NOT NULL,
    linea smallint NOT NULL,
    cuenta_id integer NOT NULL,
    debe_gs bigint DEFAULT 0 NOT NULL,
    haber_gs bigint DEFAULT 0 NOT NULL,
    glosa character varying(255),
    CONSTRAINT detalles_asiento_debe_xor_haber CHECK (((debe_gs >= 0) AND (haber_gs >= 0) AND ((debe_gs > 0) <> (haber_gs > 0))))
);


--
-- Name: detalles_asiento_contable_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.detalles_asiento_contable ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.detalles_asiento_contable_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: empresas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.empresas (
    id integer NOT NULL,
    ruc character varying(20) NOT NULL,
    dv character(1) NOT NULL,
    razon_social character varying(200) NOT NULL,
    nombre_fantasia character varying(200),
    direccion character varying(255),
    numero_casa character varying(10),
    ciudad_id integer,
    telefono character varying(30),
    email character varying(150),
    actividad_economica_id integer,
    estado public.estado_registro DEFAULT 'activo'::public.estado_registro NOT NULL,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    actualizado_en timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: empresas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.empresas ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.empresas_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: establecimientos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.establecimientos (
    id integer NOT NULL,
    empresa_id integer NOT NULL,
    sucursal_id integer NOT NULL,
    codigo character(3) NOT NULL,
    denominacion character varying(120) NOT NULL,
    direccion character varying(255),
    estado public.estado_registro DEFAULT 'activo'::public.estado_registro NOT NULL,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    actualizado_en timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT establecimientos_codigo_fmt CHECK ((codigo ~ '^[0-9]{3}$'::text))
);


--
-- Name: establecimientos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.establecimientos ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.establecimientos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: factura_compra_detalles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.factura_compra_detalles (
    id integer NOT NULL,
    empresa_id integer NOT NULL,
    sucursal_id integer NOT NULL,
    factura_compra_id integer NOT NULL,
    detalle_origen_id integer,
    linea smallint NOT NULL,
    articulo_id integer NOT NULL,
    descripcion character varying(200) NOT NULL,
    unidad_medida_id integer,
    factor_conversion numeric(14,3) DEFAULT 1 NOT NULL,
    cantidad numeric(14,3) DEFAULT 0 NOT NULL,
    precio_unitario_gs bigint DEFAULT 0 NOT NULL,
    descuento_gs bigint DEFAULT 0 NOT NULL,
    origen_descuento public.origen_descuento DEFAULT 'ninguno'::public.origen_descuento NOT NULL,
    descuento_id integer,
    tipo_iva public.tipo_iva NOT NULL,
    total_linea_gs bigint DEFAULT 0 NOT NULL,
    iva_gs bigint DEFAULT 0 NOT NULL,
    costo_unitario_gs bigint DEFAULT 0 NOT NULL,
    cantidad_recibida numeric(14,3) DEFAULT 0 NOT NULL,
    CONSTRAINT factura_compra_detalles_cantidad_pos CHECK ((cantidad > (0)::numeric)),
    CONSTRAINT factura_compra_detalles_descuento_origen CHECK ((((origen_descuento <> 'ninguno'::public.origen_descuento) OR (descuento_gs = 0)) AND ((origen_descuento <> 'automatico'::public.origen_descuento) OR (descuento_id IS NOT NULL)))),
    CONSTRAINT factura_compra_detalles_factor_pos CHECK ((factor_conversion > (0)::numeric)),
    CONSTRAINT factura_compra_detalles_iva_exenta CHECK (((tipo_iva <> 'exenta'::public.tipo_iva) OR (iva_gs = 0))),
    CONSTRAINT factura_compra_detalles_montos_no_neg CHECK (((precio_unitario_gs >= 0) AND (descuento_gs >= 0) AND (total_linea_gs >= 0) AND (iva_gs >= 0))),
    CONSTRAINT factura_compra_detalles_pend CHECK (((cantidad_recibida >= (0)::numeric) AND (cantidad_recibida <= cantidad) AND (costo_unitario_gs >= 0)))
);


--
-- Name: factura_compra_detalles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.factura_compra_detalles ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.factura_compra_detalles_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: factura_venta_detalles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.factura_venta_detalles (
    id integer NOT NULL,
    empresa_id integer NOT NULL,
    sucursal_id integer NOT NULL,
    factura_venta_id integer NOT NULL,
    detalle_origen_id integer,
    linea smallint NOT NULL,
    articulo_id integer NOT NULL,
    descripcion character varying(200) NOT NULL,
    unidad_medida_id integer,
    factor_conversion numeric(14,3) DEFAULT 1 NOT NULL,
    cantidad numeric(14,3) DEFAULT 0 NOT NULL,
    precio_unitario_gs bigint DEFAULT 0 NOT NULL,
    descuento_gs bigint DEFAULT 0 NOT NULL,
    origen_descuento public.origen_descuento DEFAULT 'ninguno'::public.origen_descuento NOT NULL,
    descuento_id integer,
    tipo_iva public.tipo_iva NOT NULL,
    total_linea_gs bigint DEFAULT 0 NOT NULL,
    iva_gs bigint DEFAULT 0 NOT NULL,
    costo_unitario_gs bigint DEFAULT 0 NOT NULL,
    CONSTRAINT factura_venta_detalles_cantidad_pos CHECK ((cantidad > (0)::numeric)),
    CONSTRAINT factura_venta_detalles_descuento_origen CHECK ((((origen_descuento <> 'ninguno'::public.origen_descuento) OR (descuento_gs = 0)) AND ((origen_descuento <> 'automatico'::public.origen_descuento) OR (descuento_id IS NOT NULL)))),
    CONSTRAINT factura_venta_detalles_factor_pos CHECK ((factor_conversion > (0)::numeric)),
    CONSTRAINT factura_venta_detalles_iva_exenta CHECK (((tipo_iva <> 'exenta'::public.tipo_iva) OR (iva_gs = 0))),
    CONSTRAINT factura_venta_detalles_montos_no_neg CHECK (((precio_unitario_gs >= 0) AND (descuento_gs >= 0) AND (total_linea_gs >= 0) AND (iva_gs >= 0)))
);


--
-- Name: factura_venta_detalles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.factura_venta_detalles ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.factura_venta_detalles_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: facturas_compra; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.facturas_compra (
    id integer NOT NULL,
    empresa_id integer NOT NULL,
    sucursal_id integer NOT NULL,
    proveedor_id integer NOT NULL,
    orden_compra_id integer,
    timbrado character varying(8) NOT NULL,
    timbrado_vencimiento date,
    establecimiento character(3) NOT NULL,
    punto_expedicion character(3) NOT NULL,
    numero integer NOT NULL,
    cdc character(44),
    fecha_emision date NOT NULL,
    condicion_operacion public.condicion_operacion DEFAULT 'contado'::public.condicion_operacion NOT NULL,
    condicion_pago_id integer,
    fecha_vencimiento date,
    deposito_id integer,
    observacion text,
    gravada_10_gs bigint DEFAULT 0 NOT NULL,
    gravada_5_gs bigint DEFAULT 0 NOT NULL,
    exenta_gs bigint DEFAULT 0 NOT NULL,
    iva_10_gs bigint DEFAULT 0 NOT NULL,
    iva_5_gs bigint DEFAULT 0 NOT NULL,
    total_iva_gs bigint DEFAULT 0 NOT NULL,
    total_descuento_gs bigint DEFAULT 0 NOT NULL,
    total_gs bigint DEFAULT 0 NOT NULL,
    estado public.estado_factura_compra DEFAULT 'borrador'::public.estado_factura_compra NOT NULL,
    creado_por integer NOT NULL,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    actualizado_en timestamp with time zone DEFAULT now() NOT NULL,
    confirmado_por integer,
    confirmado_en timestamp with time zone,
    anulado_por integer,
    anulado_en timestamp with time zone,
    motivo_anulacion text,
    CONSTRAINT facturas_compra_iva_cuadra CHECK ((total_iva_gs = (iva_10_gs + iva_5_gs))),
    CONSTRAINT facturas_compra_numero_rango CHECK (((numero >= 1) AND (numero <= 9999999))),
    CONSTRAINT facturas_compra_total_cuadra CHECK ((total_gs = ((gravada_10_gs + gravada_5_gs) + exenta_gs))),
    CONSTRAINT facturas_compra_totales_no_neg CHECK (((gravada_10_gs >= 0) AND (gravada_5_gs >= 0) AND (exenta_gs >= 0) AND (iva_10_gs >= 0) AND (iva_5_gs >= 0)))
);


--
-- Name: facturas_compra_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.facturas_compra ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.facturas_compra_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: facturas_venta; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.facturas_venta (
    id integer NOT NULL,
    empresa_id integer NOT NULL,
    sucursal_id integer NOT NULL,
    presupuesto_id integer,
    cliente_id integer,
    vendedor_id integer,
    deposito_id integer NOT NULL,
    sesion_caja_id integer,
    modalidad public.modalidad_facturacion DEFAULT 'electronica'::public.modalidad_facturacion NOT NULL,
    tipo_documento public.tipo_documento_electronico DEFAULT 'factura'::public.tipo_documento_electronico NOT NULL,
    timbrado_id integer,
    punto_expedicion_id integer,
    timbrado character varying(8),
    establecimiento character(3),
    punto_expedicion character(3),
    numero integer,
    fecha_emision timestamp with time zone DEFAULT now() NOT NULL,
    cdc character(44),
    codigo_seguridad character(9),
    tipo_emision public.tipo_emision DEFAULT 'normal'::public.tipo_emision NOT NULL,
    tipo_transaccion public.tipo_transaccion DEFAULT 'venta_mercaderia'::public.tipo_transaccion NOT NULL,
    condicion_operacion public.condicion_operacion DEFAULT 'contado'::public.condicion_operacion NOT NULL,
    plazo_dias smallint,
    cantidad_cuotas smallint,
    moneda character(3) DEFAULT 'PYG'::bpchar NOT NULL,
    estado_sifen public.estado_sifen DEFAULT 'pendiente'::public.estado_sifen NOT NULL,
    sifen_codigo_respuesta character varying(10),
    sifen_mensaje text,
    sifen_lote character varying(30),
    sifen_aprobado_en timestamp with time zone,
    xml_firmado text,
    qr_url text,
    receptor_es_contribuyente boolean DEFAULT false NOT NULL,
    receptor_tipo_documento_id integer,
    receptor_numero_documento character varying(20),
    receptor_dv character(1),
    receptor_razon_social character varying(200) DEFAULT 'SIN NOMBRE'::character varying NOT NULL,
    receptor_direccion character varying(255),
    receptor_telefono character varying(30),
    receptor_email character varying(150),
    receptor_pais character(3) DEFAULT 'PRY'::bpchar NOT NULL,
    observacion text,
    gravada_10_gs bigint DEFAULT 0 NOT NULL,
    gravada_5_gs bigint DEFAULT 0 NOT NULL,
    exenta_gs bigint DEFAULT 0 NOT NULL,
    iva_10_gs bigint DEFAULT 0 NOT NULL,
    iva_5_gs bigint DEFAULT 0 NOT NULL,
    total_iva_gs bigint DEFAULT 0 NOT NULL,
    total_descuento_gs bigint DEFAULT 0 NOT NULL,
    total_gs bigint DEFAULT 0 NOT NULL,
    total_costo_gs bigint DEFAULT 0 NOT NULL,
    estado public.estado_documento DEFAULT 'borrador'::public.estado_documento NOT NULL,
    creado_por integer NOT NULL,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    actualizado_en timestamp with time zone DEFAULT now() NOT NULL,
    confirmado_por integer,
    confirmado_en timestamp with time zone,
    anulado_por integer,
    anulado_en timestamp with time zone,
    motivo_anulacion text,
    CONSTRAINT facturas_venta_cdc_electronica CHECK (((modalidad = 'electronica'::public.modalidad_facturacion) OR (cdc IS NULL))),
    CONSTRAINT facturas_venta_credito CHECK (((condicion_operacion = 'contado'::public.condicion_operacion) OR ((cantidad_cuotas IS NOT NULL) AND (cantidad_cuotas >= 1)))),
    CONSTRAINT facturas_venta_iva_cuadra CHECK ((total_iva_gs = (iva_10_gs + iva_5_gs))),
    CONSTRAINT facturas_venta_numerada CHECK (((estado = 'borrador'::public.estado_documento) OR ((numero IS NOT NULL) AND (timbrado IS NOT NULL) AND (establecimiento IS NOT NULL) AND (punto_expedicion IS NOT NULL)))),
    CONSTRAINT facturas_venta_numero_rango CHECK (((numero IS NULL) OR ((numero >= 1) AND (numero <= 9999999)))),
    CONSTRAINT facturas_venta_total_cuadra CHECK ((total_gs = ((gravada_10_gs + gravada_5_gs) + exenta_gs))),
    CONSTRAINT facturas_venta_totales_no_neg CHECK (((gravada_10_gs >= 0) AND (gravada_5_gs >= 0) AND (exenta_gs >= 0) AND (iva_10_gs >= 0) AND (iva_5_gs >= 0)))
);


--
-- Name: facturas_venta_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.facturas_venta ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.facturas_venta_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: historico_costos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.historico_costos (
    id integer NOT NULL,
    empresa_id integer NOT NULL,
    sucursal_id integer NOT NULL,
    articulo_id integer NOT NULL,
    deposito_id integer,
    proveedor_id integer,
    detalle_factura_compra_id integer NOT NULL,
    recepcion_detalle_id integer,
    fecha date NOT NULL,
    cantidad numeric(14,3) DEFAULT 0 NOT NULL,
    costo_unitario_gs bigint DEFAULT 0 NOT NULL,
    costo_promedio_anterior_gs bigint DEFAULT 0 NOT NULL,
    costo_promedio_nuevo_gs bigint DEFAULT 0 NOT NULL,
    creado_por integer,
    creado_en timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: historico_costos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.historico_costos ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.historico_costos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: kardex; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kardex (
    id integer NOT NULL,
    empresa_id integer NOT NULL,
    sucursal_id integer NOT NULL,
    deposito_id integer NOT NULL,
    articulo_id integer NOT NULL,
    fecha timestamp with time zone DEFAULT now() NOT NULL,
    tipo_movimiento public.tipo_movimiento_kardex NOT NULL,
    origen_tipo public.origen_documento NOT NULL,
    origen_id integer,
    origen_detalle_id integer,
    cantidad_entrada numeric(14,3) DEFAULT 0 NOT NULL,
    cantidad_salida numeric(14,3) DEFAULT 0 NOT NULL,
    saldo_cantidad numeric(14,3) DEFAULT 0 NOT NULL,
    costo_unitario_gs bigint DEFAULT 0 NOT NULL,
    costo_promedio_gs bigint DEFAULT 0 NOT NULL,
    saldo_valorizado_gs bigint DEFAULT 0 NOT NULL,
    usuario_id integer,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT kardex_entrada_xor_salida CHECK (((cantidad_entrada >= (0)::numeric) AND (cantidad_salida >= (0)::numeric) AND ((cantidad_entrada > (0)::numeric) <> (cantidad_salida > (0)::numeric))))
);


--
-- Name: kardex_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.kardex ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.kardex_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: marcas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.marcas (
    id integer NOT NULL,
    empresa_id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    estado public.estado_registro DEFAULT 'activo'::public.estado_registro NOT NULL,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    actualizado_en timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: marcas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.marcas ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.marcas_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: modelos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.modelos (
    id integer NOT NULL,
    empresa_id integer NOT NULL,
    marca_id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    estado public.estado_registro DEFAULT 'activo'::public.estado_registro NOT NULL,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    actualizado_en timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: modelos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.modelos ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.modelos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: numeraciones_documento; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.numeraciones_documento (
    id integer NOT NULL,
    empresa_id integer NOT NULL,
    sucursal_id integer NOT NULL,
    timbrado_id integer NOT NULL,
    punto_expedicion_id integer NOT NULL,
    tipo_documento public.tipo_documento_electronico DEFAULT 'factura'::public.tipo_documento_electronico NOT NULL,
    numero_desde integer DEFAULT 1 NOT NULL,
    numero_hasta integer DEFAULT 9999999 NOT NULL,
    numero_actual integer DEFAULT 0 NOT NULL,
    estado public.estado_registro DEFAULT 'activo'::public.estado_registro NOT NULL,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    actualizado_en timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT numeraciones_doc_rango CHECK (((numero_desde >= 1) AND (numero_hasta <= 9999999) AND (numero_desde <= numero_hasta) AND (numero_actual >= 0) AND (numero_actual <= numero_hasta)))
);


--
-- Name: numeraciones_documento_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.numeraciones_documento ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.numeraciones_documento_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: orden_compra_detalles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orden_compra_detalles (
    id integer NOT NULL,
    empresa_id integer NOT NULL,
    sucursal_id integer NOT NULL,
    orden_compra_id integer NOT NULL,
    detalle_origen_id integer,
    linea smallint NOT NULL,
    articulo_id integer NOT NULL,
    descripcion character varying(200) NOT NULL,
    unidad_medida_id integer,
    factor_conversion numeric(14,3) DEFAULT 1 NOT NULL,
    cantidad numeric(14,3) DEFAULT 0 NOT NULL,
    precio_unitario_gs bigint DEFAULT 0 NOT NULL,
    descuento_gs bigint DEFAULT 0 NOT NULL,
    origen_descuento public.origen_descuento DEFAULT 'ninguno'::public.origen_descuento NOT NULL,
    descuento_id integer,
    tipo_iva public.tipo_iva NOT NULL,
    total_linea_gs bigint DEFAULT 0 NOT NULL,
    iva_gs bigint DEFAULT 0 NOT NULL,
    cantidad_facturada numeric(14,3) DEFAULT 0 NOT NULL,
    CONSTRAINT orden_compra_detalles_cantidad_pos CHECK ((cantidad > (0)::numeric)),
    CONSTRAINT orden_compra_detalles_descuento_origen CHECK ((((origen_descuento <> 'ninguno'::public.origen_descuento) OR (descuento_gs = 0)) AND ((origen_descuento <> 'automatico'::public.origen_descuento) OR (descuento_id IS NOT NULL)))),
    CONSTRAINT orden_compra_detalles_factor_pos CHECK ((factor_conversion > (0)::numeric)),
    CONSTRAINT orden_compra_detalles_iva_exenta CHECK (((tipo_iva <> 'exenta'::public.tipo_iva) OR (iva_gs = 0))),
    CONSTRAINT orden_compra_detalles_montos_no_neg CHECK (((precio_unitario_gs >= 0) AND (descuento_gs >= 0) AND (total_linea_gs >= 0) AND (iva_gs >= 0))),
    CONSTRAINT orden_compra_detalles_pend CHECK (((cantidad_facturada >= (0)::numeric) AND (cantidad_facturada <= cantidad)))
);


--
-- Name: orden_compra_detalles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.orden_compra_detalles ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.orden_compra_detalles_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: orden_compra_pedidos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orden_compra_pedidos (
    empresa_id integer NOT NULL,
    sucursal_id integer NOT NULL,
    orden_compra_id integer NOT NULL,
    pedido_compra_id integer NOT NULL
);


--
-- Name: orden_pago_detalles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orden_pago_detalles (
    id integer NOT NULL,
    empresa_id integer NOT NULL,
    sucursal_id integer NOT NULL,
    orden_pago_id integer NOT NULL,
    cuenta_pagar_id integer NOT NULL,
    monto_gs bigint DEFAULT 0 NOT NULL,
    CONSTRAINT orden_pago_detalles_monto_pos CHECK ((monto_gs > 0))
);


--
-- Name: orden_pago_detalles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.orden_pago_detalles ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.orden_pago_detalles_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: ordenes_compra; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ordenes_compra (
    id integer NOT NULL,
    empresa_id integer NOT NULL,
    sucursal_id integer NOT NULL,
    numero integer NOT NULL,
    fecha date NOT NULL,
    proveedor_id integer NOT NULL,
    condicion_pago_id integer,
    deposito_id integer,
    fecha_entrega_estimada date,
    observacion text,
    gravada_10_gs bigint DEFAULT 0 NOT NULL,
    gravada_5_gs bigint DEFAULT 0 NOT NULL,
    exenta_gs bigint DEFAULT 0 NOT NULL,
    iva_10_gs bigint DEFAULT 0 NOT NULL,
    iva_5_gs bigint DEFAULT 0 NOT NULL,
    total_iva_gs bigint DEFAULT 0 NOT NULL,
    total_descuento_gs bigint DEFAULT 0 NOT NULL,
    total_gs bigint DEFAULT 0 NOT NULL,
    estado public.estado_orden_compra DEFAULT 'borrador'::public.estado_orden_compra NOT NULL,
    creado_por integer NOT NULL,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    actualizado_en timestamp with time zone DEFAULT now() NOT NULL,
    confirmado_por integer,
    confirmado_en timestamp with time zone,
    anulado_por integer,
    anulado_en timestamp with time zone,
    motivo_anulacion text,
    CONSTRAINT ordenes_compra_iva_cuadra CHECK ((total_iva_gs = (iva_10_gs + iva_5_gs))),
    CONSTRAINT ordenes_compra_total_cuadra CHECK ((total_gs = ((gravada_10_gs + gravada_5_gs) + exenta_gs))),
    CONSTRAINT ordenes_compra_totales_no_neg CHECK (((gravada_10_gs >= 0) AND (gravada_5_gs >= 0) AND (exenta_gs >= 0) AND (iva_10_gs >= 0) AND (iva_5_gs >= 0)))
);


--
-- Name: ordenes_compra_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.ordenes_compra ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.ordenes_compra_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: ordenes_pago; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ordenes_pago (
    id integer NOT NULL,
    empresa_id integer NOT NULL,
    sucursal_id integer NOT NULL,
    numero integer NOT NULL,
    fecha date NOT NULL,
    proveedor_id integer NOT NULL,
    medio_pago public.medio_pago DEFAULT 'transferencia'::public.medio_pago NOT NULL,
    referencia character varying(100),
    banco character varying(100),
    observacion text,
    total_gs bigint DEFAULT 0 NOT NULL,
    estado public.estado_documento DEFAULT 'borrador'::public.estado_documento NOT NULL,
    creado_por integer NOT NULL,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    actualizado_en timestamp with time zone DEFAULT now() NOT NULL,
    confirmado_por integer,
    confirmado_en timestamp with time zone,
    anulado_por integer,
    anulado_en timestamp with time zone,
    motivo_anulacion text,
    CONSTRAINT ordenes_pago_total_no_neg CHECK ((total_gs >= 0))
);


--
-- Name: ordenes_pago_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.ordenes_pago ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.ordenes_pago_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: paises; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.paises (
    id integer NOT NULL,
    codigo_iso character(3) NOT NULL,
    nombre character varying(80) NOT NULL,
    nacionalidad character varying(80),
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    actualizado_en timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: paises_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.paises ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.paises_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: parametros_generales; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.parametros_generales (
    id integer NOT NULL,
    empresa_id integer NOT NULL,
    sucursal_id integer,
    clave character varying(80) NOT NULL,
    valor text NOT NULL,
    descripcion character varying(255),
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    actualizado_en timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: parametros_generales_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.parametros_generales ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.parametros_generales_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: pedido_compra_detalles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pedido_compra_detalles (
    id integer NOT NULL,
    empresa_id integer NOT NULL,
    sucursal_id integer NOT NULL,
    pedido_compra_id integer NOT NULL,
    linea smallint NOT NULL,
    articulo_id integer NOT NULL,
    unidad_medida_id integer,
    cantidad numeric(14,3) DEFAULT 0 NOT NULL,
    cantidad_ordenada numeric(14,3) DEFAULT 0 NOT NULL,
    observacion character varying(255),
    CONSTRAINT pedido_compra_detalles_cant CHECK (((cantidad > (0)::numeric) AND (cantidad_ordenada >= (0)::numeric) AND (cantidad_ordenada <= cantidad)))
);


--
-- Name: pedido_compra_detalles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.pedido_compra_detalles ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.pedido_compra_detalles_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: pedidos_compra; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pedidos_compra (
    id integer NOT NULL,
    empresa_id integer NOT NULL,
    sucursal_id integer NOT NULL,
    numero integer NOT NULL,
    fecha date NOT NULL,
    proveedor_id integer,
    deposito_id integer,
    observacion text,
    estado public.estado_pedido_compra DEFAULT 'borrador'::public.estado_pedido_compra NOT NULL,
    creado_por integer NOT NULL,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    actualizado_en timestamp with time zone DEFAULT now() NOT NULL,
    confirmado_por integer,
    confirmado_en timestamp with time zone,
    anulado_por integer,
    anulado_en timestamp with time zone,
    motivo_anulacion text
);


--
-- Name: pedidos_compra_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.pedidos_compra ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.pedidos_compra_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: permisos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.permisos (
    id integer NOT NULL,
    codigo character varying(80) NOT NULL,
    modulo character varying(40) NOT NULL,
    descripcion character varying(255) NOT NULL,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    actualizado_en timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: permisos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.permisos ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.permisos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: personas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.personas (
    id integer NOT NULL,
    empresa_id integer NOT NULL,
    tipo_persona_id integer NOT NULL,
    tipo_documento_id integer NOT NULL,
    numero_documento character varying(20) NOT NULL,
    dv character(1),
    razon_social character varying(200) NOT NULL,
    nombres character varying(120),
    apellidos character varying(120),
    nombre_fantasia character varying(200),
    es_contribuyente boolean DEFAULT false NOT NULL,
    actividad_economica_id integer,
    pais_id integer,
    ciudad_id integer,
    direccion character varying(255),
    numero_casa character varying(10),
    telefono character varying(30),
    celular character varying(30),
    email character varying(150),
    observacion text,
    estado public.estado_registro DEFAULT 'activo'::public.estado_registro NOT NULL,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    actualizado_en timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: personas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.personas ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.personas_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: plan_cuentas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.plan_cuentas (
    id integer NOT NULL,
    empresa_id integer NOT NULL,
    codigo character varying(20) NOT NULL,
    nombre character varying(150) NOT NULL,
    padre_id integer,
    nivel smallint NOT NULL,
    tipo public.tipo_cuenta_contable NOT NULL,
    imputable boolean DEFAULT false NOT NULL,
    estado public.estado_registro DEFAULT 'activo'::public.estado_registro NOT NULL,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    actualizado_en timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT plan_cuentas_nivel_pos CHECK ((nivel >= 1))
);


--
-- Name: plan_cuentas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.plan_cuentas ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.plan_cuentas_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: presupuesto_detalles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.presupuesto_detalles (
    id integer NOT NULL,
    empresa_id integer NOT NULL,
    sucursal_id integer NOT NULL,
    presupuesto_id integer NOT NULL,
    linea smallint NOT NULL,
    articulo_id integer NOT NULL,
    descripcion character varying(200) NOT NULL,
    unidad_medida_id integer,
    factor_conversion numeric(14,3) DEFAULT 1 NOT NULL,
    cantidad numeric(14,3) DEFAULT 0 NOT NULL,
    precio_unitario_gs bigint DEFAULT 0 NOT NULL,
    descuento_gs bigint DEFAULT 0 NOT NULL,
    origen_descuento public.origen_descuento DEFAULT 'ninguno'::public.origen_descuento NOT NULL,
    descuento_id integer,
    tipo_iva public.tipo_iva NOT NULL,
    total_linea_gs bigint DEFAULT 0 NOT NULL,
    iva_gs bigint DEFAULT 0 NOT NULL,
    cantidad_facturada numeric(14,3) DEFAULT 0 NOT NULL,
    CONSTRAINT presupuesto_detalles_cantidad_pos CHECK ((cantidad > (0)::numeric)),
    CONSTRAINT presupuesto_detalles_descuento_origen CHECK ((((origen_descuento <> 'ninguno'::public.origen_descuento) OR (descuento_gs = 0)) AND ((origen_descuento <> 'automatico'::public.origen_descuento) OR (descuento_id IS NOT NULL)))),
    CONSTRAINT presupuesto_detalles_factor_pos CHECK ((factor_conversion > (0)::numeric)),
    CONSTRAINT presupuesto_detalles_iva_exenta CHECK (((tipo_iva <> 'exenta'::public.tipo_iva) OR (iva_gs = 0))),
    CONSTRAINT presupuesto_detalles_montos_no_neg CHECK (((precio_unitario_gs >= 0) AND (descuento_gs >= 0) AND (total_linea_gs >= 0) AND (iva_gs >= 0))),
    CONSTRAINT presupuesto_detalles_pend CHECK (((cantidad_facturada >= (0)::numeric) AND (cantidad_facturada <= cantidad)))
);


--
-- Name: presupuesto_detalles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.presupuesto_detalles ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.presupuesto_detalles_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: presupuestos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.presupuestos (
    id integer NOT NULL,
    empresa_id integer NOT NULL,
    sucursal_id integer NOT NULL,
    numero integer NOT NULL,
    fecha date NOT NULL,
    fecha_validez date,
    cliente_id integer,
    vendedor_id integer,
    condicion_operacion public.condicion_operacion DEFAULT 'contado'::public.condicion_operacion NOT NULL,
    observacion text,
    gravada_10_gs bigint DEFAULT 0 NOT NULL,
    gravada_5_gs bigint DEFAULT 0 NOT NULL,
    exenta_gs bigint DEFAULT 0 NOT NULL,
    iva_10_gs bigint DEFAULT 0 NOT NULL,
    iva_5_gs bigint DEFAULT 0 NOT NULL,
    total_iva_gs bigint DEFAULT 0 NOT NULL,
    total_descuento_gs bigint DEFAULT 0 NOT NULL,
    total_gs bigint DEFAULT 0 NOT NULL,
    estado public.estado_presupuesto DEFAULT 'borrador'::public.estado_presupuesto NOT NULL,
    creado_por integer NOT NULL,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    actualizado_en timestamp with time zone DEFAULT now() NOT NULL,
    confirmado_por integer,
    confirmado_en timestamp with time zone,
    anulado_por integer,
    anulado_en timestamp with time zone,
    motivo_anulacion text,
    CONSTRAINT presupuestos_iva_cuadra CHECK ((total_iva_gs = (iva_10_gs + iva_5_gs))),
    CONSTRAINT presupuestos_total_cuadra CHECK ((total_gs = ((gravada_10_gs + gravada_5_gs) + exenta_gs))),
    CONSTRAINT presupuestos_totales_no_neg CHECK (((gravada_10_gs >= 0) AND (gravada_5_gs >= 0) AND (exenta_gs >= 0) AND (iva_10_gs >= 0) AND (iva_5_gs >= 0)))
);


--
-- Name: presupuestos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.presupuestos ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.presupuestos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: proveedores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.proveedores (
    id integer NOT NULL,
    empresa_id integer NOT NULL,
    persona_id integer NOT NULL,
    codigo character varying(20),
    condicion_pago_id integer,
    contacto character varying(150),
    saldo_gs bigint DEFAULT 0 NOT NULL,
    observacion text,
    estado public.estado_registro DEFAULT 'activo'::public.estado_registro NOT NULL,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    actualizado_en timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: proveedores_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.proveedores ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.proveedores_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: puntos_expedicion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.puntos_expedicion (
    id integer NOT NULL,
    empresa_id integer NOT NULL,
    sucursal_id integer NOT NULL,
    establecimiento_id integer NOT NULL,
    codigo character(3) NOT NULL,
    descripcion character varying(120),
    estado public.estado_registro DEFAULT 'activo'::public.estado_registro NOT NULL,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    actualizado_en timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT puntos_expedicion_codigo_fmt CHECK ((codigo ~ '^[0-9]{3}$'::text))
);


--
-- Name: puntos_expedicion_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.puntos_expedicion ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.puntos_expedicion_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: recepcion_detalles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recepcion_detalles (
    id integer NOT NULL,
    empresa_id integer NOT NULL,
    sucursal_id integer NOT NULL,
    recepcion_id integer NOT NULL,
    linea smallint NOT NULL,
    detalle_origen_id integer NOT NULL,
    articulo_id integer NOT NULL,
    cantidad numeric(14,3) DEFAULT 0 NOT NULL,
    factor_conversion numeric(14,3) DEFAULT 1 NOT NULL,
    cantidad_base numeric(14,3) DEFAULT 0 NOT NULL,
    costo_unitario_gs bigint DEFAULT 0 NOT NULL,
    total_costo_gs bigint DEFAULT 0 NOT NULL,
    CONSTRAINT recepcion_detalles_cant CHECK (((cantidad > (0)::numeric) AND (cantidad_base > (0)::numeric) AND (factor_conversion > (0)::numeric) AND (costo_unitario_gs >= 0) AND (total_costo_gs >= 0)))
);


--
-- Name: recepcion_detalles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.recepcion_detalles ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.recepcion_detalles_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: recepciones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recepciones (
    id integer NOT NULL,
    empresa_id integer NOT NULL,
    sucursal_id integer NOT NULL,
    numero integer NOT NULL,
    fecha date NOT NULL,
    factura_compra_id integer NOT NULL,
    deposito_id integer NOT NULL,
    observacion text,
    total_costo_gs bigint DEFAULT 0 NOT NULL,
    estado public.estado_documento DEFAULT 'borrador'::public.estado_documento NOT NULL,
    creado_por integer NOT NULL,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    actualizado_en timestamp with time zone DEFAULT now() NOT NULL,
    confirmado_por integer,
    confirmado_en timestamp with time zone,
    anulado_por integer,
    anulado_en timestamp with time zone,
    motivo_anulacion text
);


--
-- Name: recepciones_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.recepciones ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.recepciones_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: rol_permisos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rol_permisos (
    rol_id integer NOT NULL,
    permiso_id integer NOT NULL,
    creado_en timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    empresa_id integer NOT NULL,
    codigo character varying(30) NOT NULL,
    nombre character varying(80) NOT NULL,
    descripcion character varying(255),
    descuento_manual_max_pct numeric(5,2) DEFAULT 0 NOT NULL,
    es_sistema boolean DEFAULT false NOT NULL,
    estado public.estado_registro DEFAULT 'activo'::public.estado_registro NOT NULL,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    actualizado_en timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT roles_descuento_rango CHECK (((descuento_manual_max_pct >= (0)::numeric) AND (descuento_manual_max_pct <= (100)::numeric)))
);


--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.roles ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.roles_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: sesiones_caja; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sesiones_caja (
    id integer NOT NULL,
    empresa_id integer NOT NULL,
    sucursal_id integer NOT NULL,
    caja_id integer NOT NULL,
    usuario_id integer NOT NULL,
    abierta_en timestamp with time zone DEFAULT now() NOT NULL,
    monto_apertura_gs bigint DEFAULT 0 NOT NULL,
    total_efectivo_gs bigint DEFAULT 0 NOT NULL,
    total_transferencia_gs bigint DEFAULT 0 NOT NULL,
    total_tarjeta_gs bigint DEFAULT 0 NOT NULL,
    total_qr_gs bigint DEFAULT 0 NOT NULL,
    efectivo_declarado_gs bigint DEFAULT 0 NOT NULL,
    diferencia_gs bigint DEFAULT 0 NOT NULL,
    cerrada_en timestamp with time zone,
    cerrada_por integer,
    observacion_cierre text,
    estado public.estado_sesion_caja DEFAULT 'abierta'::public.estado_sesion_caja NOT NULL,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    actualizado_en timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT sesiones_caja_apertura_no_neg CHECK ((monto_apertura_gs >= 0)),
    CONSTRAINT sesiones_caja_cierre CHECK (((estado = 'abierta'::public.estado_sesion_caja) OR ((cerrada_en IS NOT NULL) AND (cerrada_por IS NOT NULL))))
);


--
-- Name: sesiones_caja_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.sesiones_caja ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.sesiones_caja_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: sifen_eventos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sifen_eventos (
    id integer NOT NULL,
    empresa_id integer NOT NULL,
    sucursal_id integer NOT NULL,
    factura_venta_id integer,
    cdc character(44),
    tipo_evento public.tipo_evento_sifen NOT NULL,
    estado_sifen_resultante public.estado_sifen,
    codigo_respuesta character varying(10),
    mensaje text,
    request_xml text,
    response_xml text,
    usuario_id integer,
    creado_en timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: sifen_eventos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.sifen_eventos ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.sifen_eventos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: stock; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stock (
    id integer NOT NULL,
    empresa_id integer NOT NULL,
    sucursal_id integer NOT NULL,
    deposito_id integer NOT NULL,
    articulo_id integer NOT NULL,
    cantidad numeric(14,3) DEFAULT 0 NOT NULL,
    cantidad_reservada numeric(14,3) DEFAULT 0 NOT NULL,
    costo_promedio_gs bigint DEFAULT 0 NOT NULL,
    ultimo_costo_gs bigint DEFAULT 0 NOT NULL,
    actualizado_en timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT stock_costos_no_neg CHECK (((costo_promedio_gs >= 0) AND (ultimo_costo_gs >= 0)))
);


--
-- Name: stock_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.stock ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.stock_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: sucursales; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sucursales (
    id integer NOT NULL,
    empresa_id integer NOT NULL,
    codigo character varying(10) NOT NULL,
    nombre character varying(120) NOT NULL,
    direccion character varying(255),
    ciudad_id integer,
    telefono character varying(30),
    email character varying(150),
    es_casa_matriz boolean DEFAULT false NOT NULL,
    estado public.estado_registro DEFAULT 'activo'::public.estado_registro NOT NULL,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    actualizado_en timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: sucursales_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.sucursales ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.sucursales_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: timbrados; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.timbrados (
    id integer NOT NULL,
    empresa_id integer NOT NULL,
    numero character varying(8) NOT NULL,
    modalidad public.modalidad_facturacion DEFAULT 'electronica'::public.modalidad_facturacion NOT NULL,
    fecha_inicio_vigencia date NOT NULL,
    fecha_fin_vigencia date,
    estado public.estado_registro DEFAULT 'activo'::public.estado_registro NOT NULL,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    actualizado_en timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT timbrados_numero_fmt CHECK (((numero)::text ~ '^[0-9]{8}$'::text)),
    CONSTRAINT timbrados_vigencia CHECK (((fecha_fin_vigencia IS NULL) OR (fecha_fin_vigencia >= fecha_inicio_vigencia)))
);


--
-- Name: timbrados_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.timbrados ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.timbrados_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: tipos_documento; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tipos_documento (
    id integer NOT NULL,
    codigo character varying(10) NOT NULL,
    nombre character varying(80) NOT NULL,
    codigo_sifen smallint,
    requiere_dv boolean DEFAULT false NOT NULL,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    actualizado_en timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: tipos_documento_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.tipos_documento ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.tipos_documento_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: tipos_persona; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tipos_persona (
    id integer NOT NULL,
    codigo character varying(2) NOT NULL,
    nombre character varying(60) NOT NULL,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    actualizado_en timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: tipos_persona_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.tipos_persona ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.tipos_persona_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: transferencia_stock_detalles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transferencia_stock_detalles (
    id integer NOT NULL,
    empresa_id integer NOT NULL,
    sucursal_id integer NOT NULL,
    transferencia_stock_id integer NOT NULL,
    linea smallint NOT NULL,
    articulo_id integer NOT NULL,
    cantidad numeric(14,3) DEFAULT 0 NOT NULL,
    cantidad_recibida numeric(14,3) DEFAULT 0 NOT NULL,
    costo_unitario_gs bigint DEFAULT 0 NOT NULL,
    CONSTRAINT transferencia_stock_detalles_cant CHECK (((cantidad > (0)::numeric) AND (cantidad_recibida >= (0)::numeric) AND (cantidad_recibida <= cantidad)))
);


--
-- Name: transferencia_stock_detalles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.transferencia_stock_detalles ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.transferencia_stock_detalles_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: transferencias_stock; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transferencias_stock (
    id integer NOT NULL,
    empresa_id integer NOT NULL,
    sucursal_id integer NOT NULL,
    sucursal_destino_id integer NOT NULL,
    deposito_origen_id integer NOT NULL,
    deposito_destino_id integer NOT NULL,
    numero integer NOT NULL,
    fecha date NOT NULL,
    observacion text,
    total_costo_gs bigint DEFAULT 0 NOT NULL,
    estado public.estado_transferencia DEFAULT 'borrador'::public.estado_transferencia NOT NULL,
    enviado_por integer,
    enviado_en timestamp with time zone,
    recibido_por integer,
    recibido_en timestamp with time zone,
    creado_por integer NOT NULL,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    actualizado_en timestamp with time zone DEFAULT now() NOT NULL,
    confirmado_por integer,
    confirmado_en timestamp with time zone,
    anulado_por integer,
    anulado_en timestamp with time zone,
    motivo_anulacion text,
    CONSTRAINT transferencias_stock_depositos CHECK ((deposito_origen_id <> deposito_destino_id))
);


--
-- Name: transferencias_stock_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.transferencias_stock ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.transferencias_stock_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: unidades_medida; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.unidades_medida (
    id integer NOT NULL,
    codigo character varying(10) NOT NULL,
    nombre character varying(60) NOT NULL,
    codigo_sifen smallint,
    permite_decimales boolean DEFAULT false NOT NULL,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    actualizado_en timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: unidades_medida_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.unidades_medida ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.unidades_medida_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: usuario_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.usuario_roles (
    id integer NOT NULL,
    usuario_id integer NOT NULL,
    rol_id integer NOT NULL,
    sucursal_id integer,
    creado_en timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: usuario_roles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.usuario_roles ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.usuario_roles_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: usuarios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.usuarios (
    id integer NOT NULL,
    empresa_id integer NOT NULL,
    usuario character varying(60) NOT NULL,
    nombre character varying(150) NOT NULL,
    email character varying(150),
    password_hash character varying(255) NOT NULL,
    sucursal_predeterminada_id integer,
    estado public.estado_registro DEFAULT 'activo'::public.estado_registro NOT NULL,
    ultimo_acceso_en timestamp with time zone,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    actualizado_en timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT usuarios_usuario_minus CHECK (((usuario)::text = lower((usuario)::text)))
);


--
-- Name: usuarios_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.usuarios ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.usuarios_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: __drizzle_migrations id; Type: DEFAULT; Schema: drizzle; Owner: -
--

ALTER TABLE ONLY drizzle.__drizzle_migrations ALTER COLUMN id SET DEFAULT nextval('drizzle.__drizzle_migrations_id_seq'::regclass);


--
-- Data for Name: __drizzle_migrations; Type: TABLE DATA; Schema: drizzle; Owner: -
--

COPY drizzle.__drizzle_migrations (id, hash, created_at) FROM stdin;
1	63238acdf688a3b654a477a29baea0082c078e9d7781c5404dec81b8d8472751	1795372574765
2	2515ce180ecc861567aa97a7a49351c45e8e2fd131d7fe4c3bac184c5cc4b771	1795372582324
\.


--
-- Data for Name: actividades_economicas; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.actividades_economicas (id, codigo, descripcion, creado_en, actualizado_en) FROM stdin;
1	47521	Comercio al por menor de artículos de ferretería	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
2	47522	Comercio al por menor de pinturas, barnices y lacas	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
3	46631	Comercio al por mayor de materiales de construcción y artículos de ferretería	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
\.


--
-- Data for Name: ajuste_stock_detalles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ajuste_stock_detalles (id, empresa_id, sucursal_id, ajuste_stock_id, linea, articulo_id, cantidad, cantidad_sistema, costo_unitario_gs, total_costo_gs, observacion) FROM stdin;
\.


--
-- Data for Name: ajustes_stock; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ajustes_stock (id, empresa_id, sucursal_id, numero, fecha, deposito_id, tipo_ajuste, motivo, observacion, total_costo_gs, estado, creado_por, creado_en, actualizado_en, confirmado_por, confirmado_en, anulado_por, anulado_en, motivo_anulacion) FROM stdin;
\.


--
-- Data for Name: arqueos_caja; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.arqueos_caja (id, empresa_id, sucursal_id, sesion_caja_id, medio_pago, monto_sistema_gs, monto_declarado_gs, diferencia_gs, observacion) FROM stdin;
\.


--
-- Data for Name: articulo_unidades; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.articulo_unidades (id, empresa_id, articulo_id, unidad_medida_id, factor_conversion, codigo_barras, precio_venta_gs, es_predeterminada, estado, creado_en, actualizado_en) FROM stdin;
1	1	5	10	100.000	\N	420000	f	activo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
2	1	6	8	100.000	\N	25000	f	activo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
\.


--
-- Data for Name: articulos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.articulos (id, empresa_id, codigo, codigo_barras, descripcion, descripcion_larga, categoria_id, marca_id, modelo_id, unidad_medida_id, tipo_iva, precio_venta_gs, costo_referencia_gs, controla_stock, permite_decimales, stock_minimo, estado, creado_en, actualizado_en) FROM stdin;
1	1	HM-0001	7790000000011	Martillo carpintero 27 mm mango fibra	\N	7	1	\N	1	iva10	85000	52000	t	f	5.000	activo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
2	1	HM-0002	7790000000028	Llave ajustable 10 pulgadas	\N	7	2	\N	1	iva10	120000	75000	t	f	5.000	activo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
3	1	HM-0003	7790000000035	Cinta métrica 5 m	\N	7	3	\N	1	iva10	35000	19000	t	f	5.000	activo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
4	1	HE-0001	7790000000042	Taladro percutor 650 W 13 mm	\N	8	4	\N	1	iva10	650000	430000	t	f	5.000	activo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
5	1	EL-0001	7790000000059	Cable unipolar 2,5 mm² (por metro)	\N	2	5	\N	2	iva10	4500	2700	t	t	5.000	activo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
6	1	FI-0001	7790000000066	Tornillo autoperforante 8x1"	\N	3	5	\N	1	iva10	300	150	t	f	5.000	activo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
7	1	FI-0002	7790000000073	Clavo punta parís 2" (por kg)	\N	3	5	\N	5	iva10	18000	11000	t	t	5.000	activo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
8	1	PI-0001	7790000000080	Pintura látex interior blanco 4 L	\N	4	5	\N	1	iva10	145000	92000	t	f	5.000	activo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
9	1	CO-0001	7790000000097	Cemento Portland bolsa 50 kg	\N	5	5	\N	9	iva10	62000	48000	t	f	5.000	activo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
10	1	JA-0001	7790000000103	Semilla de césped 1 kg	\N	6	5	\N	5	iva5	55000	36000	t	t	5.000	activo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
\.


--
-- Data for Name: asientos_contables; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.asientos_contables (id, empresa_id, sucursal_id, numero, fecha, concepto, origen_tipo, origen_id, asiento_revertido_id, total_debe_gs, total_haber_gs, estado, creado_por, creado_en, actualizado_en, confirmado_por, confirmado_en, anulado_por, anulado_en, motivo_anulacion) FROM stdin;
2	1	1	2	2026-11-22	Reversión asiento N° 1: Mala impresion	factura_venta	1	1	1190000	1190000	confirmado	1	2026-11-22 20:30:42.379409+00	2026-11-22 20:30:42.379409+00	1	2026-11-22 20:30:42.396+00	\N	\N	\N
1	1	1	1	2026-11-22	Factura de venta 001-001-0000001	factura_venta	1	\N	1190000	1190000	anulado	1	2026-11-22 20:29:34.842379+00	2026-11-22 20:30:42.398+00	1	2026-11-22 20:29:34.897+00	1	2026-11-22 20:30:42.398+00	Mala impresion
3	1	1	3	2026-11-22	Factura de venta 001-001-0000002	factura_venta	4	\N	110000	110000	confirmado	1	2026-11-22 20:33:52.255124+00	2026-11-22 20:33:52.255124+00	1	2026-11-22 20:33:52.283+00	\N	\N	\N
4	1	1	4	2026-11-22	Factura de venta 001-001-0000003	factura_venta	5	\N	110000	110000	confirmado	1	2026-11-22 20:34:06.567983+00	2026-11-22 20:34:06.567983+00	1	2026-11-22 20:34:06.591+00	\N	\N	\N
\.


--
-- Data for Name: cajas; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cajas (id, empresa_id, sucursal_id, codigo, nombre, punto_expedicion_id, deposito_id, estado, creado_en, actualizado_en) FROM stdin;
1	1	1	CAJA-01	Caja 1 Matriz	1	1	activo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
2	1	2	CAJA-01	Caja 1 San Lorenzo	2	3	activo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
\.


--
-- Data for Name: categorias_articulo; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.categorias_articulo (id, empresa_id, codigo, nombre, padre_id, estado, creado_en, actualizado_en) FROM stdin;
1	1	HER	Herramientas	\N	activo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
2	1	ELEC	Electricidad	\N	activo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
3	1	FIJ	Fijaciones y bulonería	\N	activo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
4	1	PINT	Pinturas	\N	activo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
5	1	CONS	Materiales de construcción	\N	activo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
6	1	JARD	Jardinería	\N	activo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
7	1	HER-MAN	Herramientas manuales	1	activo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
8	1	HER-ELE	Herramientas eléctricas	1	activo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
\.


--
-- Data for Name: ciudades; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ciudades (id, departamento_id, nombre, codigo_sifen, creado_en, actualizado_en) FROM stdin;
1	1	Asunción	1	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
2	2	Concepción	\N	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
3	2	Horqueta	\N	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
4	3	San Pedro de Ycuamandiyú	\N	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
5	3	San Estanislao	\N	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
6	4	Caacupé	\N	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
7	4	Tobatí	\N	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
8	5	Villarrica	\N	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
9	6	Coronel Oviedo	\N	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
10	6	Caaguazú	\N	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
11	7	Caazapá	\N	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
12	8	Encarnación	\N	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
13	8	Hohenau	\N	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
14	9	San Juan Bautista	\N	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
15	9	San Ignacio	\N	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
16	10	Paraguarí	\N	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
17	10	Carapeguá	\N	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
18	11	Ciudad del Este	\N	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
19	11	Presidente Franco	\N	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
20	11	Hernandarias	\N	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
21	11	Minga Guazú	\N	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
22	12	San Lorenzo	\N	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
23	12	Luque	\N	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
24	12	Capiatá	\N	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
25	12	Lambaré	\N	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
26	12	Fernando de la Mora	\N	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
27	12	Limpio	\N	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
28	12	Ñemby	\N	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
29	12	Mariano Roque Alonso	\N	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
30	12	Villa Elisa	\N	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
31	12	Itauguá	\N	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
32	12	Areguá	\N	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
33	13	Pilar	\N	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
34	14	Pedro Juan Caballero	\N	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
35	15	Salto del Guairá	\N	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
36	15	Curuguaty	\N	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
37	16	Villa Hayes	\N	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
38	17	Fuerte Olimpo	\N	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
39	18	Filadelfia	\N	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
40	18	Loma Plata	\N	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
\.


--
-- Data for Name: clientes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.clientes (id, empresa_id, persona_id, codigo, condicion_pago_id, limite_credito_gs, saldo_gs, observacion, estado, creado_en, actualizado_en) FROM stdin;
1	1	1	CLI-0000	1	0	0	\N	activo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
3	1	3	CLI-0002	2	50000000	0	\N	activo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
4	1	4	CLI-0003	1	0	62000	\N	activo	2026-11-22 19:58:04.29856+00	2026-11-22 20:33:52.279+00
2	1	2	CLI-0001	1	0	62000	\N	activo	2026-11-22 19:58:04.29856+00	2026-11-22 20:34:06.588+00
\.


--
-- Data for Name: cobro_detalles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cobro_detalles (id, empresa_id, sucursal_id, cobro_id, cuenta_cobrar_id, monto_gs) FROM stdin;
\.


--
-- Data for Name: cobro_medios; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cobro_medios (id, empresa_id, sucursal_id, cobro_id, medio_pago, monto_gs, referencia, banco, tipo_tarjeta, marca_tarjeta, ultimos_digitos) FROM stdin;
\.


--
-- Data for Name: cobros; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cobros (id, empresa_id, sucursal_id, numero, fecha, cliente_id, sesion_caja_id, total_gs, vuelto_gs, observacion, estado, creado_por, creado_en, actualizado_en, confirmado_por, confirmado_en, anulado_por, anulado_en, motivo_anulacion) FROM stdin;
\.


--
-- Data for Name: condiciones_pago; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.condiciones_pago (id, empresa_id, codigo, nombre, condicion, dias_plazo, cantidad_cuotas, dias_entre_cuotas, estado, creado_en, actualizado_en) FROM stdin;
1	1	CONTADO	Contado	contado	0	1	30	activo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
2	1	CRED30	Crédito 30 días	credito	30	1	30	activo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
3	1	CRED-3C	Crédito 3 cuotas mensuales	credito	30	3	30	activo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
\.


--
-- Data for Name: configuracion_contable; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.configuracion_contable (id, empresa_id, operacion, concepto, lado, cuenta_id, descripcion, creado_en, actualizado_en) FROM stdin;
1	1	compra	mercaderias_transito	debe	21	Neto de la compra	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
2	1	compra	iva_credito	debe	19	IVA 10% y 5% de la compra	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
3	1	compra	proveedores	haber	25	Total factura de compra	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
4	1	recepcion	mercaderias	debe	20	Ingreso a depósito	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
5	1	recepcion	mercaderias_transito	haber	21	Baja de mercadería a recibir	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
6	1	venta	deudores	debe	18	Total factura de venta	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
7	1	venta	ventas_10	haber	31	Neto gravado 10%	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
8	1	venta	ventas_5	haber	32	Neto gravado 5%	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
9	1	venta	ventas_exentas	haber	33	Ventas exentas	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
10	1	venta	iva_debito	haber	26	IVA débito 10% y 5%	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
11	1	costo_venta	cmv	debe	36	Costo de lo vendido	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
12	1	costo_venta	mercaderias	haber	20	Salida de mercadería	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
13	1	cobro	efectivo	debe	16	Cobro en efectivo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
14	1	cobro	transferencia	debe	17	Cobro por transferencia	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
15	1	cobro	tarjeta	debe	22	Cobro con tarjeta	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
16	1	cobro	qr	debe	22	Cobro con QR / billetera	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
17	1	cobro	deudores	haber	18	Cancelación de deudores	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
18	1	pago	proveedores	debe	25	Cancelación de proveedores	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
19	1	pago	efectivo	haber	16	Pago en efectivo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
20	1	pago	transferencia	haber	17	Pago por transferencia	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
21	1	ajuste_merma	mermas	debe	37	Pérdida por merma	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
22	1	ajuste_merma	mercaderias	haber	20	Baja de mercadería	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
23	1	ajuste_sobrante	mercaderias	debe	20	Alta de mercadería	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
24	1	ajuste_sobrante	sobrantes	haber	34	Sobrante de inventario	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
25	1	transferencia	mercaderias_destino	debe	20	Ingreso en sucursal destino	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
26	1	transferencia	mercaderias_origen	haber	20	Salida de sucursal origen	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
27	1	diferencia_caja	faltante	debe	42	Faltante en arqueo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
28	1	diferencia_caja	sobrante	haber	35	Sobrante en arqueo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
29	1	diferencia_caja	efectivo	haber	16	Contrapartida en caja (lado según signo)	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
\.


--
-- Data for Name: configuracion_sifen; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.configuracion_sifen (id, empresa_id, sucursal_id, ambiente, id_csc, csc_ref, certificado_ruta, certificado_password_ref, url_ws_recepcion, url_ws_consulta, url_qr_base, envio_por_lote, activo, creado_en, actualizado_en) FROM stdin;
1	1	\N	test	0001	SIFEN_CSC	./certs/empresa-demo.p12	SIFEN_CERT_PASSWORD	https://sifen-test.set.gov.py/de/ws/sync/recibe.wsdl	https://sifen-test.set.gov.py/de/ws/consultas/consulta.wsdl	https://ekuatia.set.gov.py/consultas-test/qr?	f	t	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
\.


--
-- Data for Name: cuentas_cobrar; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cuentas_cobrar (id, empresa_id, sucursal_id, cliente_id, factura_venta_id, cuota_venta_id, numero_cuota, fecha_vencimiento, monto_gs, saldo_gs, estado, creado_en, actualizado_en) FROM stdin;
1	1	1	2	1	\N	1	2026-11-22	712000	0	anulado	2026-11-22 20:29:34.842379+00	2026-11-22 20:30:42.382+00
2	1	1	4	4	\N	1	2026-11-22	62000	62000	pendiente	2026-11-22 20:33:52.255124+00	2026-11-22 20:33:52.255124+00
3	1	1	2	5	\N	1	2026-11-22	62000	62000	pendiente	2026-11-22 20:34:06.567983+00	2026-11-22 20:34:06.567983+00
\.


--
-- Data for Name: cuentas_pagar; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cuentas_pagar (id, empresa_id, sucursal_id, proveedor_id, factura_compra_id, numero_cuota, fecha_vencimiento, monto_gs, saldo_gs, estado, creado_en, actualizado_en) FROM stdin;
\.


--
-- Data for Name: cuotas_venta; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cuotas_venta (id, empresa_id, sucursal_id, factura_venta_id, numero_cuota, fecha_vencimiento, monto_gs) FROM stdin;
\.


--
-- Data for Name: departamentos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.departamentos (id, pais_id, codigo, nombre, creado_en, actualizado_en) FROM stdin;
1	1	1	Capital	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
2	1	2	Concepción	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
3	1	3	San Pedro	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
4	1	4	Cordillera	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
5	1	5	Guairá	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
6	1	6	Caaguazú	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
7	1	7	Caazapá	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
8	1	8	Itapúa	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
9	1	9	Misiones	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
10	1	10	Paraguarí	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
11	1	11	Alto Paraná	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
12	1	12	Central	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
13	1	13	Ñeembucú	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
14	1	14	Amambay	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
15	1	15	Canindeyú	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
16	1	16	Presidente Hayes	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
17	1	17	Alto Paraguay	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
18	1	18	Boquerón	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
\.


--
-- Data for Name: depositos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.depositos (id, empresa_id, sucursal_id, codigo, nombre, es_principal, permite_venta, estado, creado_en, actualizado_en) FROM stdin;
1	1	1	DEP-001	Depósito salón Matriz	t	t	activo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
2	1	1	DEP-001-PATIO	Patio de materiales Matriz	f	f	activo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
3	1	2	DEP-002	Depósito San Lorenzo	t	t	activo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
\.


--
-- Data for Name: descuento_articulos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.descuento_articulos (id, empresa_id, descuento_id, articulo_id, porcentaje, monto_gs, cantidad_minima, tope_gs) FROM stdin;
1	1	1	1	10.00	\N	1.000	50000
2	1	1	2	10.00	\N	1.000	50000
3	1	1	3	10.00	\N	1.000	50000
\.


--
-- Data for Name: descuento_sucursales; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.descuento_sucursales (id, empresa_id, descuento_id, sucursal_id) FROM stdin;
1	1	1	1
2	1	1	2
\.


--
-- Data for Name: descuentos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.descuentos (id, empresa_id, codigo, nombre, descripcion, tipo, fecha_desde, fecha_hasta, prioridad, acumulable, todas_sucursales, estado, creado_por, creado_en, actualizado_en, confirmado_por, confirmado_en, anulado_por, anulado_en, motivo_anulacion) FROM stdin;
1	1	PROMO-HERR-10	Promo herramientas manuales 10%	10% de descuento en herramientas manuales seleccionadas	porcentaje	2026-10-23	2027-02-20	10	f	f	activo	1	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00	1	2026-11-22 19:58:04.715+00	\N	\N	\N
\.


--
-- Data for Name: detalles_asiento_contable; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.detalles_asiento_contable (id, empresa_id, sucursal_id, asiento_id, linea, cuenta_id, debe_gs, haber_gs, glosa) FROM stdin;
1	1	1	1	1	18	712000	0	Total factura de venta
2	1	1	1	2	31	0	647273	Neto gravado 10%
3	1	1	1	3	26	0	64727	IVA débito 10% y 5%
4	1	1	1	4	36	478000	0	Costo de lo vendido
5	1	1	1	5	20	0	478000	Salida de mercadería
6	1	1	2	1	18	0	712000	Total factura de venta
7	1	1	2	2	31	647273	0	Neto gravado 10%
8	1	1	2	3	26	64727	0	IVA débito 10% y 5%
9	1	1	2	4	36	0	478000	Costo de lo vendido
10	1	1	2	5	20	478000	0	Salida de mercadería
11	1	1	3	1	18	62000	0	Total factura de venta
12	1	1	3	2	31	0	56364	Neto gravado 10%
13	1	1	3	3	26	0	5636	IVA débito 10% y 5%
14	1	1	3	4	36	48000	0	Costo de lo vendido
15	1	1	3	5	20	0	48000	Salida de mercadería
16	1	1	4	1	18	62000	0	Total factura de venta
17	1	1	4	2	31	0	56364	Neto gravado 10%
18	1	1	4	3	26	0	5636	IVA débito 10% y 5%
19	1	1	4	4	36	48000	0	Costo de lo vendido
20	1	1	4	5	20	0	48000	Salida de mercadería
\.


--
-- Data for Name: empresas; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.empresas (id, ruc, dv, razon_social, nombre_fantasia, direccion, numero_casa, ciudad_id, telefono, email, actividad_economica_id, estado, creado_en, actualizado_en) FROM stdin;
1	80012345	0	FERRETERÍA DEMO S.A.	Ferre Demo	Avda. Mariscal López 1234	1234	1	021 600 000	contacto@ferreteria-demo.com.py	1	activo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
\.


--
-- Data for Name: establecimientos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.establecimientos (id, empresa_id, sucursal_id, codigo, denominacion, direccion, estado, creado_en, actualizado_en) FROM stdin;
1	1	1	001	Casa Matriz	\N	activo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
2	1	2	002	San Lorenzo	\N	activo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
\.


--
-- Data for Name: factura_compra_detalles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.factura_compra_detalles (id, empresa_id, sucursal_id, factura_compra_id, detalle_origen_id, linea, articulo_id, descripcion, unidad_medida_id, factor_conversion, cantidad, precio_unitario_gs, descuento_gs, origen_descuento, descuento_id, tipo_iva, total_linea_gs, iva_gs, costo_unitario_gs, cantidad_recibida) FROM stdin;
\.


--
-- Data for Name: factura_venta_detalles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.factura_venta_detalles (id, empresa_id, sucursal_id, factura_venta_id, detalle_origen_id, linea, articulo_id, descripcion, unidad_medida_id, factor_conversion, cantidad, precio_unitario_gs, descuento_gs, origen_descuento, descuento_id, tipo_iva, total_linea_gs, iva_gs, costo_unitario_gs) FROM stdin;
3	1	1	1	5	1	9	Cemento Portland bolsa 50 kg	9	1.000	1.000	62000	0	ninguno	\N	iva10	62000	5636	48000
4	1	1	1	6	2	4	Taladro percutor 650 W 13 mm	1	1.000	1.000	650000	0	ninguno	\N	iva10	650000	59091	430000
5	1	1	2	8	1	9	Cemento Portland bolsa 50 kg	9	1.000	1.000	62000	0	ninguno	\N	iva10	62000	5636	0
6	1	1	3	8	1	9	Cemento Portland bolsa 50 kg	9	1.000	1.000	62000	0	ninguno	\N	iva10	62000	5636	0
8	1	1	4	10	1	9	Cemento Portland bolsa 50 kg	9	1.000	1.000	62000	0	ninguno	\N	iva10	62000	5636	48000
10	1	1	5	8	1	9	Cemento Portland bolsa 50 kg	9	1.000	1.000	62000	0	ninguno	\N	iva10	62000	5636	48000
\.


--
-- Data for Name: facturas_compra; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.facturas_compra (id, empresa_id, sucursal_id, proveedor_id, orden_compra_id, timbrado, timbrado_vencimiento, establecimiento, punto_expedicion, numero, cdc, fecha_emision, condicion_operacion, condicion_pago_id, fecha_vencimiento, deposito_id, observacion, gravada_10_gs, gravada_5_gs, exenta_gs, iva_10_gs, iva_5_gs, total_iva_gs, total_descuento_gs, total_gs, estado, creado_por, creado_en, actualizado_en, confirmado_por, confirmado_en, anulado_por, anulado_en, motivo_anulacion) FROM stdin;
\.


--
-- Data for Name: facturas_venta; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.facturas_venta (id, empresa_id, sucursal_id, presupuesto_id, cliente_id, vendedor_id, deposito_id, sesion_caja_id, modalidad, tipo_documento, timbrado_id, punto_expedicion_id, timbrado, establecimiento, punto_expedicion, numero, fecha_emision, cdc, codigo_seguridad, tipo_emision, tipo_transaccion, condicion_operacion, plazo_dias, cantidad_cuotas, moneda, estado_sifen, sifen_codigo_respuesta, sifen_mensaje, sifen_lote, sifen_aprobado_en, xml_firmado, qr_url, receptor_es_contribuyente, receptor_tipo_documento_id, receptor_numero_documento, receptor_dv, receptor_razon_social, receptor_direccion, receptor_telefono, receptor_email, receptor_pais, observacion, gravada_10_gs, gravada_5_gs, exenta_gs, iva_10_gs, iva_5_gs, total_iva_gs, total_descuento_gs, total_gs, total_costo_gs, estado, creado_por, creado_en, actualizado_en, confirmado_por, confirmado_en, anulado_por, anulado_en, motivo_anulacion) FROM stdin;
1	1	1	1	2	1	1	\N	electronica	factura	1	1	18000001	001	001	1	2026-11-22 20:29:34.884+00	01800123450001001000000122026112210676292234	067629223	normal	venta_mercaderia	contado	\N	\N	PYG	cancelado	0260	Autorización del DE satisfactoria (simulado)	STUB-1795379374912	2026-11-22 20:29:34.913+00	<?xml version="1.0" encoding="UTF-8"?><rDE><DE Id="01800123450001001000000122026112210676292234"><dFecFirma>2026-11-22T20:29:34.882Z</dFecFirma><gTimb><iTiDE>1</iTiDE><dNumTim>18000001</dNumTim><dEst>001</dEst><dPunExp>001</dPunExp><dNumDoc>0000001</dNumDoc></gTimb><gEmis><dRucEm>80012345</dRucEm><dDVEmi>0</dDVEmi><dNomEmi>FERRETERÍA DEMO S.A.</dNomEmi></gEmis><gDatRec><dNomRec>JUAN PÉREZ</dNomRec><dNumIDRec>1234567</dNumIDRec></gDatRec><gDtipDE><gCamItem><dCodInt>9</dCodInt><dDesProSer>Cemento Portland bolsa 50 kg</dDesProSer><dCantProSer>1</dCantProSer><dPUniProSer>62000</dPUniProSer><dDescItem>0</dDescItem><dTotOpeItem>62000</dTotOpeItem><dLiqIVAItem>5636</dLiqIVAItem></gCamItem><gCamItem><dCodInt>4</dCodInt><dDesProSer>Taladro percutor 650 W 13 mm</dDesProSer><dCantProSer>1</dCantProSer><dPUniProSer>650000</dPUniProSer><dDescItem>0</dDescItem><dTotOpeItem>650000</dTotOpeItem><dLiqIVAItem>59091</dLiqIVAItem></gCamItem></gDtipDE><gTotSub><dTotGralOpe>712000</dTotGralOpe><dTotIVA>64727</dTotIVA></gTotSub></DE></rDE>	https://ekuatia.set.gov.py/consultas-test/qr?nVersion=150&Id=01800123450001001000000122026112210676292234&dFeEmiDE=323032362d31312d32325431373a32393a3334&dNumIDRec=1234567&dTotGralOpe=712000&dTotIVA=64727&cItems=2&DigestValue=5255724570315750505053333145353658436e56772f73514734556361524d306274496265652f564543593d&IdCSC=0001&cHashQR=0c0262801426631db9c70bfc3b853251d7d574c7d9ef6b7d6a1a810d5fd995b4	f	2	1234567	\N	JUAN PÉREZ	\N	0981 000 111	\N	PRY	\N	712000	0	0	64727	0	64727	0	712000	478000	anulado	1	2026-11-22 20:28:43.075456+00	2026-11-22 20:30:42.4+00	1	2026-11-22 20:29:34.884+00	1	2026-11-22 20:30:42.399+00	Mala impresion
2	1	1	2	2	1	1	\N	electronica	factura	\N	\N	\N	\N	\N	\N	2026-11-22 20:32:43.776161+00	\N	\N	normal	venta_mercaderia	contado	\N	\N	PYG	pendiente	\N	\N	\N	\N	\N	\N	f	2	1234567	\N	JUAN PÉREZ	\N	0981 000 111	\N	PRY	\N	62000	0	0	5636	0	5636	0	62000	0	borrador	1	2026-11-22 20:32:43.776161+00	2026-11-22 20:32:43.776161+00	\N	\N	\N	\N	\N
3	1	1	2	2	1	1	\N	electronica	factura	\N	\N	\N	\N	\N	\N	2026-11-22 20:33:07.650698+00	\N	\N	normal	venta_mercaderia	contado	\N	\N	PYG	pendiente	\N	\N	\N	\N	\N	\N	f	2	1234567	\N	JUAN PÉREZ	\N	0981 000 111	\N	PRY	\N	62000	0	0	5636	0	5636	0	62000	0	borrador	1	2026-11-22 20:33:07.650698+00	2026-11-22 20:33:07.650698+00	\N	\N	\N	\N	\N
4	1	1	3	4	1	1	\N	electronica	factura	1	1	18000001	001	001	2	2026-11-22 20:33:52.275+00	01800123450001001000000222026112218561351685	856135168	normal	venta_mercaderia	contado	\N	\N	PYG	aprobado	0260	Autorización del DE satisfactoria (simulado)	STUB-1795379632293	2026-11-22 20:33:52.294+00	<?xml version="1.0" encoding="UTF-8"?><rDE><DE Id="01800123450001001000000222026112218561351685"><dFecFirma>2026-11-22T20:33:52.275Z</dFecFirma><gTimb><iTiDE>1</iTiDE><dNumTim>18000001</dNumTim><dEst>001</dEst><dPunExp>001</dPunExp><dNumDoc>0000002</dNumDoc></gTimb><gEmis><dRucEm>80012345</dRucEm><dDVEmi>0</dDVEmi><dNomEmi>FERRETERÍA DEMO S.A.</dNomEmi></gEmis><gDatRec><dNomRec>DISTRIBUIDORA FERRETERA DEL SUR S.A.</dNomRec><dRucRec>80055550</dRucRec><dDVRec>3</dDVRec></gDatRec><gDtipDE><gCamItem><dCodInt>9</dCodInt><dDesProSer>Cemento Portland bolsa 50 kg</dDesProSer><dCantProSer>1</dCantProSer><dPUniProSer>62000</dPUniProSer><dDescItem>0</dDescItem><dTotOpeItem>62000</dTotOpeItem><dLiqIVAItem>5636</dLiqIVAItem></gCamItem></gDtipDE><gTotSub><dTotGralOpe>62000</dTotGralOpe><dTotIVA>5636</dTotIVA></gTotSub></DE></rDE>	https://ekuatia.set.gov.py/consultas-test/qr?nVersion=150&Id=01800123450001001000000222026112218561351685&dFeEmiDE=323032362d31312d32325431373a33333a3532&dRucRec=80055550&dTotGralOpe=62000&dTotIVA=5636&cItems=1&DigestValue=3955446d6c4f5a612b67353659442f4b6e5a7a4e396367346133442f3059687a506575666e565a4f6b41733d&IdCSC=0001&cHashQR=ad533f6cea51911e0df9863fe4c5784ec9fa79a7b3688e5b588d4537a0726a7a	t	1	80055550	3	DISTRIBUIDORA FERRETERA DEL SUR S.A.	\N	\N	ventas@distribuidora-sur.com.py	PRY	\N	62000	0	0	5636	0	5636	0	62000	48000	confirmado	1	2026-11-22 20:33:45.697168+00	2026-11-22 20:33:52.294+00	1	2026-11-22 20:33:52.275+00	\N	\N	\N
5	1	1	2	2	1	1	\N	electronica	factura	1	1	18000001	001	001	3	2026-11-22 20:34:06.585+00	01800123450001001000000322026112214598597498	459859749	normal	venta_mercaderia	contado	\N	\N	PYG	aprobado	0260	Autorización del DE satisfactoria (simulado)	STUB-1795379646601	2026-11-22 20:34:06.602+00	<?xml version="1.0" encoding="UTF-8"?><rDE><DE Id="01800123450001001000000322026112214598597498"><dFecFirma>2026-11-22T20:34:06.585Z</dFecFirma><gTimb><iTiDE>1</iTiDE><dNumTim>18000001</dNumTim><dEst>001</dEst><dPunExp>001</dPunExp><dNumDoc>0000003</dNumDoc></gTimb><gEmis><dRucEm>80012345</dRucEm><dDVEmi>0</dDVEmi><dNomEmi>FERRETERÍA DEMO S.A.</dNomEmi></gEmis><gDatRec><dNomRec>JUAN PÉREZ</dNomRec><dNumIDRec>1234567</dNumIDRec></gDatRec><gDtipDE><gCamItem><dCodInt>9</dCodInt><dDesProSer>Cemento Portland bolsa 50 kg</dDesProSer><dCantProSer>1</dCantProSer><dPUniProSer>62000</dPUniProSer><dDescItem>0</dDescItem><dTotOpeItem>62000</dTotOpeItem><dLiqIVAItem>5636</dLiqIVAItem></gCamItem></gDtipDE><gTotSub><dTotGralOpe>62000</dTotGralOpe><dTotIVA>5636</dTotIVA></gTotSub></DE></rDE>	https://ekuatia.set.gov.py/consultas-test/qr?nVersion=150&Id=01800123450001001000000322026112214598597498&dFeEmiDE=323032362d31312d32325431373a33343a3036&dNumIDRec=1234567&dTotGralOpe=62000&dTotIVA=5636&cItems=1&DigestValue=6d4f4b49514b73456b5345786e3630424530535a44326a2b65666d2f50536843734c535945677a4a6f6b303d&IdCSC=0001&cHashQR=c896144e189ad0dbffb51726045affe5b0a45a383033d83eed89a67000ec21ae	f	2	1234567	\N	JUAN PÉREZ	\N	0981 000 111	\N	PRY	\N	62000	0	0	5636	0	5636	0	62000	48000	confirmado	1	2026-11-22 20:34:04.682033+00	2026-11-22 20:34:06.602+00	1	2026-11-22 20:34:06.585+00	\N	\N	\N
\.


--
-- Data for Name: historico_costos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.historico_costos (id, empresa_id, sucursal_id, articulo_id, deposito_id, proveedor_id, detalle_factura_compra_id, recepcion_detalle_id, fecha, cantidad, costo_unitario_gs, costo_promedio_anterior_gs, costo_promedio_nuevo_gs, creado_por, creado_en) FROM stdin;
\.


--
-- Data for Name: kardex; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.kardex (id, empresa_id, sucursal_id, deposito_id, articulo_id, fecha, tipo_movimiento, origen_tipo, origen_id, origen_detalle_id, cantidad_entrada, cantidad_salida, saldo_cantidad, costo_unitario_gs, costo_promedio_gs, saldo_valorizado_gs, usuario_id, creado_en) FROM stdin;
1	1	1	1	1	2026-11-22 19:58:04.29856+00	inicial	inicial	\N	\N	25.000	0.000	25.000	52000	52000	1300000	1	2026-11-22 19:58:04.29856+00
2	1	2	3	1	2026-11-22 19:58:04.29856+00	inicial	inicial	\N	\N	10.000	0.000	10.000	52000	52000	520000	1	2026-11-22 19:58:04.29856+00
3	1	1	1	2	2026-11-22 19:58:04.29856+00	inicial	inicial	\N	\N	15.000	0.000	15.000	75000	75000	1125000	1	2026-11-22 19:58:04.29856+00
4	1	2	3	2	2026-11-22 19:58:04.29856+00	inicial	inicial	\N	\N	6.000	0.000	6.000	75000	75000	450000	1	2026-11-22 19:58:04.29856+00
5	1	1	1	3	2026-11-22 19:58:04.29856+00	inicial	inicial	\N	\N	40.000	0.000	40.000	19000	19000	760000	1	2026-11-22 19:58:04.29856+00
6	1	2	3	3	2026-11-22 19:58:04.29856+00	inicial	inicial	\N	\N	20.000	0.000	20.000	19000	19000	380000	1	2026-11-22 19:58:04.29856+00
7	1	1	1	4	2026-11-22 19:58:04.29856+00	inicial	inicial	\N	\N	8.000	0.000	8.000	430000	430000	3440000	1	2026-11-22 19:58:04.29856+00
8	1	2	3	4	2026-11-22 19:58:04.29856+00	inicial	inicial	\N	\N	3.000	0.000	3.000	430000	430000	1290000	1	2026-11-22 19:58:04.29856+00
9	1	1	1	5	2026-11-22 19:58:04.29856+00	inicial	inicial	\N	\N	500.000	0.000	500.000	2700	2700	1350000	1	2026-11-22 19:58:04.29856+00
10	1	2	3	5	2026-11-22 19:58:04.29856+00	inicial	inicial	\N	\N	300.000	0.000	300.000	2700	2700	810000	1	2026-11-22 19:58:04.29856+00
11	1	1	1	6	2026-11-22 19:58:04.29856+00	inicial	inicial	\N	\N	5000.000	0.000	5000.000	150	150	750000	1	2026-11-22 19:58:04.29856+00
12	1	2	3	6	2026-11-22 19:58:04.29856+00	inicial	inicial	\N	\N	2000.000	0.000	2000.000	150	150	300000	1	2026-11-22 19:58:04.29856+00
13	1	1	1	7	2026-11-22 19:58:04.29856+00	inicial	inicial	\N	\N	120.000	0.000	120.000	11000	11000	1320000	1	2026-11-22 19:58:04.29856+00
14	1	2	3	7	2026-11-22 19:58:04.29856+00	inicial	inicial	\N	\N	60.000	0.000	60.000	11000	11000	660000	1	2026-11-22 19:58:04.29856+00
15	1	1	1	8	2026-11-22 19:58:04.29856+00	inicial	inicial	\N	\N	30.000	0.000	30.000	92000	92000	2760000	1	2026-11-22 19:58:04.29856+00
16	1	2	3	8	2026-11-22 19:58:04.29856+00	inicial	inicial	\N	\N	12.000	0.000	12.000	92000	92000	1104000	1	2026-11-22 19:58:04.29856+00
17	1	1	1	9	2026-11-22 19:58:04.29856+00	inicial	inicial	\N	\N	200.000	0.000	200.000	48000	48000	9600000	1	2026-11-22 19:58:04.29856+00
18	1	2	3	9	2026-11-22 19:58:04.29856+00	inicial	inicial	\N	\N	80.000	0.000	80.000	48000	48000	3840000	1	2026-11-22 19:58:04.29856+00
19	1	1	1	10	2026-11-22 19:58:04.29856+00	inicial	inicial	\N	\N	20.000	0.000	20.000	36000	36000	720000	1	2026-11-22 19:58:04.29856+00
20	1	2	3	10	2026-11-22 19:58:04.29856+00	inicial	inicial	\N	\N	10.000	0.000	10.000	36000	36000	360000	1	2026-11-22 19:58:04.29856+00
21	1	1	1	9	2026-11-22 20:29:34.842379+00	salida_venta	factura_venta	1	3	0.000	1.000	199.000	48000	48000	9552000	1	2026-11-22 20:29:34.842379+00
22	1	1	1	4	2026-11-22 20:29:34.842379+00	salida_venta	factura_venta	1	4	0.000	1.000	7.000	430000	430000	3010000	1	2026-11-22 20:29:34.842379+00
23	1	1	1	9	2026-11-22 20:30:42.379409+00	anulacion_venta	factura_venta	1	3	1.000	0.000	200.000	48000	48000	9600000	1	2026-11-22 20:30:42.379409+00
24	1	1	1	4	2026-11-22 20:30:42.379409+00	anulacion_venta	factura_venta	1	4	1.000	0.000	8.000	430000	430000	3440000	1	2026-11-22 20:30:42.379409+00
25	1	1	1	9	2026-11-22 20:33:52.255124+00	salida_venta	factura_venta	4	8	0.000	1.000	199.000	48000	48000	9552000	1	2026-11-22 20:33:52.255124+00
26	1	1	1	9	2026-11-22 20:34:06.567983+00	salida_venta	factura_venta	5	10	0.000	1.000	198.000	48000	48000	9504000	1	2026-11-22 20:34:06.567983+00
\.


--
-- Data for Name: marcas; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.marcas (id, empresa_id, nombre, estado, creado_en, actualizado_en) FROM stdin;
1	1	Tramontina	activo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
2	1	Stanley	activo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
3	1	Truper	activo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
4	1	Bosch	activo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
5	1	Genérica	activo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
\.


--
-- Data for Name: modelos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.modelos (id, empresa_id, marca_id, nombre, estado, creado_en, actualizado_en) FROM stdin;
\.


--
-- Data for Name: numeraciones_documento; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.numeraciones_documento (id, empresa_id, sucursal_id, timbrado_id, punto_expedicion_id, tipo_documento, numero_desde, numero_hasta, numero_actual, estado, creado_en, actualizado_en) FROM stdin;
2	1	1	1	1	nota_credito	1	9999999	0	activo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
3	1	2	1	2	factura	1	9999999	0	activo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
4	1	2	1	2	nota_credito	1	9999999	0	activo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
1	1	1	1	1	factura	1	9999999	3	activo	2026-11-22 19:58:04.29856+00	2026-11-22 20:34:06.581+00
\.


--
-- Data for Name: orden_compra_detalles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.orden_compra_detalles (id, empresa_id, sucursal_id, orden_compra_id, detalle_origen_id, linea, articulo_id, descripcion, unidad_medida_id, factor_conversion, cantidad, precio_unitario_gs, descuento_gs, origen_descuento, descuento_id, tipo_iva, total_linea_gs, iva_gs, cantidad_facturada) FROM stdin;
\.


--
-- Data for Name: orden_compra_pedidos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.orden_compra_pedidos (empresa_id, sucursal_id, orden_compra_id, pedido_compra_id) FROM stdin;
\.


--
-- Data for Name: orden_pago_detalles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.orden_pago_detalles (id, empresa_id, sucursal_id, orden_pago_id, cuenta_pagar_id, monto_gs) FROM stdin;
\.


--
-- Data for Name: ordenes_compra; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ordenes_compra (id, empresa_id, sucursal_id, numero, fecha, proveedor_id, condicion_pago_id, deposito_id, fecha_entrega_estimada, observacion, gravada_10_gs, gravada_5_gs, exenta_gs, iva_10_gs, iva_5_gs, total_iva_gs, total_descuento_gs, total_gs, estado, creado_por, creado_en, actualizado_en, confirmado_por, confirmado_en, anulado_por, anulado_en, motivo_anulacion) FROM stdin;
\.


--
-- Data for Name: ordenes_pago; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ordenes_pago (id, empresa_id, sucursal_id, numero, fecha, proveedor_id, medio_pago, referencia, banco, observacion, total_gs, estado, creado_por, creado_en, actualizado_en, confirmado_por, confirmado_en, anulado_por, anulado_en, motivo_anulacion) FROM stdin;
\.


--
-- Data for Name: paises; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.paises (id, codigo_iso, nombre, nacionalidad, creado_en, actualizado_en) FROM stdin;
1	PRY	Paraguay	Paraguaya	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
2	ARG	Argentina	Argentina	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
3	BRA	Brasil	Brasileña	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
4	BOL	Bolivia	Boliviana	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
5	URY	Uruguay	Uruguaya	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
6	CHL	Chile	Chilena	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
\.


--
-- Data for Name: parametros_generales; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.parametros_generales (id, empresa_id, sucursal_id, clave, valor, descripcion, creado_en, actualizado_en) FROM stdin;
1	1	\N	moneda	PYG	Moneda base	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
2	1	\N	stock.permitir_negativo	false	Permitir vender sin stock	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
3	1	\N	costo.metodo	promedio_ponderado	Método de costeo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
4	1	\N	ventas.validez_presupuesto_dias	15	Días de validez del presupuesto	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
5	1	\N	ventas.cliente_innominado_documento	0	Documento del cliente SIN NOMBRE	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
6	1	\N	ventas.redondeo_gs	1	Redondeo de montos en Gs	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
7	1	\N	caja.monto_apertura_sugerido_gs	500000	Fondo fijo sugerido al abrir caja	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
\.


--
-- Data for Name: pedido_compra_detalles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.pedido_compra_detalles (id, empresa_id, sucursal_id, pedido_compra_id, linea, articulo_id, unidad_medida_id, cantidad, cantidad_ordenada, observacion) FROM stdin;
\.


--
-- Data for Name: pedidos_compra; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.pedidos_compra (id, empresa_id, sucursal_id, numero, fecha, proveedor_id, deposito_id, observacion, estado, creado_por, creado_en, actualizado_en, confirmado_por, confirmado_en, anulado_por, anulado_en, motivo_anulacion) FROM stdin;
\.


--
-- Data for Name: permisos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.permisos (id, codigo, modulo, descripcion, creado_en, actualizado_en) FROM stdin;
1	organizacion.empresa.gestionar	organizacion	Gestionar datos de la empresa	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
2	organizacion.sucursal.gestionar	organizacion	Gestionar sucursales, establecimientos y puntos de expedición	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
3	organizacion.timbrado.gestionar	organizacion	Gestionar timbrados y numeraciones	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
4	organizacion.sifen.gestionar	organizacion	Gestionar configuración SIFEN	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
5	organizacion.parametros.gestionar	organizacion	Gestionar parámetros generales	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
6	seguridad.usuario.gestionar	seguridad	Gestionar usuarios	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
7	seguridad.rol.gestionar	seguridad	Gestionar roles y permisos	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
8	referenciales.gestionar	referenciales	Gestionar catálogos referenciales	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
9	personas.cliente.gestionar	personas	Gestionar clientes	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
10	personas.proveedor.gestionar	personas	Gestionar proveedores	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
11	articulos.gestionar	articulos	Gestionar artículos y presentaciones	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
12	articulos.precio.modificar	articulos	Modificar precios de venta	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
13	descuentos.gestionar	descuentos	Gestionar descuentos automáticos	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
14	compras.pedido.crear	compras	Crear pedidos de compra	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
15	compras.pedido.confirmar	compras	Confirmar pedidos de compra	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
16	compras.pedido.anular	compras	Anular pedidos de compra	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
17	compras.orden.crear	compras	Crear órdenes de compra	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
18	compras.orden.confirmar	compras	Confirmar órdenes de compra	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
19	compras.orden.anular	compras	Anular órdenes de compra	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
20	compras.factura.crear	compras	Cargar facturas de compra	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
21	compras.factura.confirmar	compras	Confirmar facturas de compra	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
22	compras.factura.anular	compras	Anular facturas de compra	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
23	compras.recepcion.crear	compras	Crear recepciones de mercadería	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
24	compras.recepcion.confirmar	compras	Confirmar recepciones (ingreso a stock)	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
25	compras.recepcion.anular	compras	Anular recepciones	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
26	compras.pago.crear	compras	Crear órdenes de pago	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
27	compras.pago.confirmar	compras	Confirmar órdenes de pago	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
28	compras.pago.anular	compras	Anular órdenes de pago	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
29	ventas.presupuesto.crear	ventas	Crear presupuestos	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
30	ventas.presupuesto.confirmar	ventas	Confirmar presupuestos	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
31	ventas.presupuesto.anular	ventas	Anular presupuestos	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
32	ventas.factura.crear	ventas	Crear facturas de venta (borrador)	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
33	ventas.factura.confirmar	ventas	Confirmar/emitir facturas de venta	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
34	ventas.factura.anular	ventas	Anular facturas de venta	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
35	ventas.descuento_manual	ventas	Aplicar descuento manual (hasta el tope del rol)	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
36	ventas.sifen.gestionar	ventas	Reenviar, consultar y cancelar documentos en SIFEN	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
37	caja.sesion.abrir	caja	Abrir sesión de caja	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
38	caja.sesion.cerrar	caja	Cerrar sesión de caja y arqueo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
39	caja.cobro.crear	caja	Registrar cobros	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
40	caja.cobro.anular	caja	Anular cobros	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
41	inventario.stock.consultar	inventario	Consultar existencias	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
42	inventario.kardex.consultar	inventario	Consultar kardex	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
43	ajustes.stock	ajustes	Crear y confirmar ajustes de stock (mermas/sobrantes)	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
44	ajustes.stock.anular	ajustes	Anular ajustes de stock	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
45	inventario.transferencia.crear	inventario	Crear transferencias de stock	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
46	inventario.transferencia.enviar	inventario	Enviar transferencias de stock	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
47	inventario.transferencia.recibir	inventario	Recibir transferencias de stock	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
48	inventario.transferencia.anular	inventario	Anular transferencias de stock	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
49	contabilidad.plan_cuentas.gestionar	contabilidad	Gestionar plan de cuentas	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
50	contabilidad.configuracion.gestionar	contabilidad	Gestionar configuración contable	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
51	contabilidad.asiento.crear	contabilidad	Crear asientos contables manuales	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
52	contabilidad.asiento.anular	contabilidad	Anular asientos contables	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
53	contabilidad.reportes.ver	contabilidad	Ver libros y reportes contables	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
54	reportes.ventas.ver	reportes	Ver reportes de ventas	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
55	reportes.compras.ver	reportes	Ver reportes de compras	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
56	reportes.inventario.ver	reportes	Ver reportes de inventario	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
\.


--
-- Data for Name: personas; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.personas (id, empresa_id, tipo_persona_id, tipo_documento_id, numero_documento, dv, razon_social, nombres, apellidos, nombre_fantasia, es_contribuyente, actividad_economica_id, pais_id, ciudad_id, direccion, numero_casa, telefono, celular, email, observacion, estado, creado_en, actualizado_en) FROM stdin;
1	1	1	5	0	\N	SIN NOMBRE	\N	\N	\N	f	\N	\N	1	\N	\N	\N	\N	\N	\N	activo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
2	1	1	2	1234567	\N	JUAN PÉREZ	Juan	Pérez	\N	f	\N	\N	23	\N	\N	0981 000 111	\N	\N	\N	activo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
3	1	2	1	80099990	8	CONSTRUCTORA EJEMPLO S.A.	\N	\N	\N	t	\N	\N	1	\N	\N	\N	\N	compras@constructora-ejemplo.com.py	\N	activo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
4	1	2	1	80055550	3	DISTRIBUIDORA FERRETERA DEL SUR S.A.	\N	\N	\N	t	\N	\N	1	\N	\N	\N	\N	ventas@distribuidora-sur.com.py	\N	activo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
5	1	1	1	5035036	6	ALEXIS JUNIOR ALVAREZ FIGUEREDO	\N	\N	\N	t	3	1	1	Central	\N	\N	0972454099	alexisalvarezf@gmail.com	\N	activo	2026-11-22 20:07:04.384683+00	2026-11-22 20:07:19.515+00
\.


--
-- Data for Name: plan_cuentas; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.plan_cuentas (id, empresa_id, codigo, nombre, padre_id, nivel, tipo, imputable, estado, creado_en, actualizado_en) FROM stdin;
1	1	1	ACTIVO	\N	1	activo	f	activo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
2	1	2	PASIVO	\N	1	pasivo	f	activo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
3	1	3	PATRIMONIO NETO	\N	1	patrimonio	f	activo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
4	1	4	INGRESOS	\N	1	ingreso	f	activo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
5	1	5	COSTOS	\N	1	costo	f	activo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
6	1	6	GASTOS	\N	1	gasto	f	activo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
7	1	1.1	Activo corriente	1	2	activo	f	activo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
8	1	1.2	Activo no corriente	1	2	activo	f	activo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
9	1	2.1	Pasivo corriente	2	2	pasivo	f	activo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
10	1	3.1	Capital	3	2	patrimonio	f	activo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
11	1	3.2	Resultados	3	2	patrimonio	f	activo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
12	1	4.1	Ventas	4	2	ingreso	f	activo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
13	1	4.2	Otros ingresos	4	2	ingreso	f	activo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
14	1	5.1	Costo de ventas	5	2	costo	f	activo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
15	1	6.1	Gastos operativos	6	2	gasto	f	activo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
16	1	1.1.01	Caja	7	3	activo	t	activo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
17	1	1.1.02	Bancos	7	3	activo	t	activo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
18	1	1.1.03	Deudores por ventas	7	3	activo	t	activo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
19	1	1.1.04	IVA crédito fiscal	7	3	activo	t	activo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
20	1	1.1.05	Mercaderías	7	3	activo	t	activo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
21	1	1.1.06	Mercaderías en tránsito / a recibir	7	3	activo	t	activo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
22	1	1.1.07	Tarjetas y billeteras a cobrar	7	3	activo	t	activo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
23	1	1.2.01	Muebles, útiles e instalaciones	8	3	activo	t	activo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
24	1	1.2.02	Rodados	8	3	activo	t	activo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
25	1	2.1.01	Proveedores	9	3	pasivo	t	activo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
26	1	2.1.02	IVA débito fiscal	9	3	pasivo	t	activo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
27	1	2.1.03	Sueldos y cargas sociales a pagar	9	3	pasivo	t	activo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
28	1	3.1.01	Capital social	10	3	patrimonio	t	activo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
29	1	3.2.01	Resultados acumulados	11	3	patrimonio	t	activo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
30	1	3.2.02	Resultado del ejercicio	11	3	patrimonio	t	activo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
31	1	4.1.01	Ventas gravadas 10%	12	3	ingreso	t	activo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
32	1	4.1.02	Ventas gravadas 5%	12	3	ingreso	t	activo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
33	1	4.1.03	Ventas exentas	12	3	ingreso	t	activo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
34	1	4.2.01	Sobrantes de inventario	13	3	ingreso	t	activo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
35	1	4.2.02	Sobrantes de caja	13	3	ingreso	t	activo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
36	1	5.1.01	Costo de mercaderías vendidas	14	3	costo	t	activo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
37	1	6.1.01	Mermas y pérdidas de inventario	15	3	gasto	t	activo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
38	1	6.1.02	Sueldos y jornales	15	3	gasto	t	activo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
39	1	6.1.03	Alquileres	15	3	gasto	t	activo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
40	1	6.1.04	Servicios básicos (ANDE, ESSAP, telefonía)	15	3	gasto	t	activo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
41	1	6.1.05	Comisiones bancarias y de tarjetas	15	3	gasto	t	activo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
42	1	6.1.06	Faltantes de caja	15	3	gasto	t	activo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
\.


--
-- Data for Name: presupuesto_detalles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.presupuesto_detalles (id, empresa_id, sucursal_id, presupuesto_id, linea, articulo_id, descripcion, unidad_medida_id, factor_conversion, cantidad, precio_unitario_gs, descuento_gs, origen_descuento, descuento_id, tipo_iva, total_linea_gs, iva_gs, cantidad_facturada) FROM stdin;
5	1	1	1	1	9	Cemento Portland bolsa 50 kg	9	1.000	1.000	62000	0	ninguno	\N	iva10	62000	5636	0.000
6	1	1	1	2	4	Taladro percutor 650 W 13 mm	1	1.000	1.000	650000	0	ninguno	\N	iva10	650000	59091	0.000
10	1	1	3	1	9	Cemento Portland bolsa 50 kg	9	1.000	1.000	62000	0	ninguno	\N	iva10	62000	5636	1.000
8	1	1	2	1	9	Cemento Portland bolsa 50 kg	9	1.000	1.000	62000	0	ninguno	\N	iva10	62000	5636	1.000
\.


--
-- Data for Name: presupuestos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.presupuestos (id, empresa_id, sucursal_id, numero, fecha, fecha_validez, cliente_id, vendedor_id, condicion_operacion, observacion, gravada_10_gs, gravada_5_gs, exenta_gs, iva_10_gs, iva_5_gs, total_iva_gs, total_descuento_gs, total_gs, estado, creado_por, creado_en, actualizado_en, confirmado_por, confirmado_en, anulado_por, anulado_en, motivo_anulacion) FROM stdin;
3	1	1	3	2026-11-22	2026-12-07	4	1	contado	\N	62000	0	0	5636	0	5636	0	62000	facturado	1	2026-11-22 20:33:40.936408+00	2026-11-22 20:33:52.26+00	1	2026-11-22 20:33:44.191+00	\N	\N	\N
2	1	1	2	2026-11-22	2026-11-22	2	1	contado	\N	62000	0	0	5636	0	5636	0	62000	facturado	1	2026-11-22 20:32:36.606459+00	2026-11-22 20:34:06.573+00	1	2026-11-22 20:32:38.651+00	\N	\N	\N
1	1	1	1	2026-11-22	2026-12-07	2	1	contado	\N	712000	0	0	64727	0	64727	0	712000	anulado	1	2026-11-22 20:28:01.782228+00	2026-11-22 20:34:22.168+00	1	2026-11-22 20:28:19.699+00	1	2026-11-22 20:34:22.168+00	desistio de compra
\.


--
-- Data for Name: proveedores; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.proveedores (id, empresa_id, persona_id, codigo, condicion_pago_id, contacto, saldo_gs, observacion, estado, creado_en, actualizado_en) FROM stdin;
1	1	4	PRO-0001	2	Departamento comercial	0	\N	activo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
2	1	5	PRO-0002	1	\N	0	\N	activo	2026-11-22 20:09:55.029034+00	2026-11-22 20:09:55.029034+00
\.


--
-- Data for Name: puntos_expedicion; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.puntos_expedicion (id, empresa_id, sucursal_id, establecimiento_id, codigo, descripcion, estado, creado_en, actualizado_en) FROM stdin;
1	1	1	1	001	Caja principal 001	activo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
2	1	2	2	001	Caja principal 002	activo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
\.


--
-- Data for Name: recepcion_detalles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.recepcion_detalles (id, empresa_id, sucursal_id, recepcion_id, linea, detalle_origen_id, articulo_id, cantidad, factor_conversion, cantidad_base, costo_unitario_gs, total_costo_gs) FROM stdin;
\.


--
-- Data for Name: recepciones; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.recepciones (id, empresa_id, sucursal_id, numero, fecha, factura_compra_id, deposito_id, observacion, total_costo_gs, estado, creado_por, creado_en, actualizado_en, confirmado_por, confirmado_en, anulado_por, anulado_en, motivo_anulacion) FROM stdin;
\.


--
-- Data for Name: rol_permisos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.rol_permisos (rol_id, permiso_id, creado_en) FROM stdin;
1	1	2026-11-22 19:58:04.29856+00
1	2	2026-11-22 19:58:04.29856+00
1	3	2026-11-22 19:58:04.29856+00
1	4	2026-11-22 19:58:04.29856+00
1	5	2026-11-22 19:58:04.29856+00
1	6	2026-11-22 19:58:04.29856+00
1	7	2026-11-22 19:58:04.29856+00
1	8	2026-11-22 19:58:04.29856+00
1	9	2026-11-22 19:58:04.29856+00
1	10	2026-11-22 19:58:04.29856+00
1	11	2026-11-22 19:58:04.29856+00
1	12	2026-11-22 19:58:04.29856+00
1	13	2026-11-22 19:58:04.29856+00
1	14	2026-11-22 19:58:04.29856+00
1	15	2026-11-22 19:58:04.29856+00
1	16	2026-11-22 19:58:04.29856+00
1	17	2026-11-22 19:58:04.29856+00
1	18	2026-11-22 19:58:04.29856+00
1	19	2026-11-22 19:58:04.29856+00
1	20	2026-11-22 19:58:04.29856+00
1	21	2026-11-22 19:58:04.29856+00
1	22	2026-11-22 19:58:04.29856+00
1	23	2026-11-22 19:58:04.29856+00
1	24	2026-11-22 19:58:04.29856+00
1	25	2026-11-22 19:58:04.29856+00
1	26	2026-11-22 19:58:04.29856+00
1	27	2026-11-22 19:58:04.29856+00
1	28	2026-11-22 19:58:04.29856+00
1	29	2026-11-22 19:58:04.29856+00
1	30	2026-11-22 19:58:04.29856+00
1	31	2026-11-22 19:58:04.29856+00
1	32	2026-11-22 19:58:04.29856+00
1	33	2026-11-22 19:58:04.29856+00
1	34	2026-11-22 19:58:04.29856+00
1	35	2026-11-22 19:58:04.29856+00
1	36	2026-11-22 19:58:04.29856+00
1	37	2026-11-22 19:58:04.29856+00
1	38	2026-11-22 19:58:04.29856+00
1	39	2026-11-22 19:58:04.29856+00
1	40	2026-11-22 19:58:04.29856+00
1	41	2026-11-22 19:58:04.29856+00
1	42	2026-11-22 19:58:04.29856+00
1	43	2026-11-22 19:58:04.29856+00
1	44	2026-11-22 19:58:04.29856+00
1	45	2026-11-22 19:58:04.29856+00
1	46	2026-11-22 19:58:04.29856+00
1	47	2026-11-22 19:58:04.29856+00
1	48	2026-11-22 19:58:04.29856+00
1	49	2026-11-22 19:58:04.29856+00
1	50	2026-11-22 19:58:04.29856+00
1	51	2026-11-22 19:58:04.29856+00
1	52	2026-11-22 19:58:04.29856+00
1	53	2026-11-22 19:58:04.29856+00
1	54	2026-11-22 19:58:04.29856+00
1	55	2026-11-22 19:58:04.29856+00
1	56	2026-11-22 19:58:04.29856+00
2	9	2026-11-22 19:58:04.29856+00
2	29	2026-11-22 19:58:04.29856+00
2	30	2026-11-22 19:58:04.29856+00
2	31	2026-11-22 19:58:04.29856+00
2	32	2026-11-22 19:58:04.29856+00
2	33	2026-11-22 19:58:04.29856+00
2	35	2026-11-22 19:58:04.29856+00
2	41	2026-11-22 19:58:04.29856+00
2	54	2026-11-22 19:58:04.29856+00
3	37	2026-11-22 19:58:04.29856+00
3	38	2026-11-22 19:58:04.29856+00
3	39	2026-11-22 19:58:04.29856+00
3	32	2026-11-22 19:58:04.29856+00
3	33	2026-11-22 19:58:04.29856+00
3	9	2026-11-22 19:58:04.29856+00
3	41	2026-11-22 19:58:04.29856+00
4	10	2026-11-22 19:58:04.29856+00
4	11	2026-11-22 19:58:04.29856+00
4	14	2026-11-22 19:58:04.29856+00
4	15	2026-11-22 19:58:04.29856+00
4	16	2026-11-22 19:58:04.29856+00
4	17	2026-11-22 19:58:04.29856+00
4	18	2026-11-22 19:58:04.29856+00
4	19	2026-11-22 19:58:04.29856+00
4	20	2026-11-22 19:58:04.29856+00
4	21	2026-11-22 19:58:04.29856+00
4	23	2026-11-22 19:58:04.29856+00
4	24	2026-11-22 19:58:04.29856+00
4	26	2026-11-22 19:58:04.29856+00
4	41	2026-11-22 19:58:04.29856+00
4	42	2026-11-22 19:58:04.29856+00
4	45	2026-11-22 19:58:04.29856+00
4	46	2026-11-22 19:58:04.29856+00
4	47	2026-11-22 19:58:04.29856+00
4	43	2026-11-22 19:58:04.29856+00
4	55	2026-11-22 19:58:04.29856+00
4	56	2026-11-22 19:58:04.29856+00
5	49	2026-11-22 19:58:04.29856+00
5	50	2026-11-22 19:58:04.29856+00
5	51	2026-11-22 19:58:04.29856+00
5	52	2026-11-22 19:58:04.29856+00
5	53	2026-11-22 19:58:04.29856+00
5	26	2026-11-22 19:58:04.29856+00
5	27	2026-11-22 19:58:04.29856+00
5	28	2026-11-22 19:58:04.29856+00
5	42	2026-11-22 19:58:04.29856+00
5	54	2026-11-22 19:58:04.29856+00
5	55	2026-11-22 19:58:04.29856+00
5	56	2026-11-22 19:58:04.29856+00
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.roles (id, empresa_id, codigo, nombre, descripcion, descuento_manual_max_pct, es_sistema, estado, creado_en, actualizado_en) FROM stdin;
1	1	ADMIN	Administrador	Acceso total	100.00	t	activo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
2	1	VENDEDOR	Vendedor	Presupuestos y facturación	10.00	t	activo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
3	1	CAJERO	Cajero	Caja, cobros y emisión de facturas	0.00	t	activo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
4	1	COMPRAS	Compras	Abastecimiento, recepción e inventario	0.00	t	activo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
5	1	CONTADOR	Contador	Contabilidad, pagos y reportes	0.00	t	activo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
\.


--
-- Data for Name: sesiones_caja; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sesiones_caja (id, empresa_id, sucursal_id, caja_id, usuario_id, abierta_en, monto_apertura_gs, total_efectivo_gs, total_transferencia_gs, total_tarjeta_gs, total_qr_gs, efectivo_declarado_gs, diferencia_gs, cerrada_en, cerrada_por, observacion_cierre, estado, creado_en, actualizado_en) FROM stdin;
\.


--
-- Data for Name: sifen_eventos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sifen_eventos (id, empresa_id, sucursal_id, factura_venta_id, cdc, tipo_evento, estado_sifen_resultante, codigo_respuesta, mensaje, request_xml, response_xml, usuario_id, creado_en) FROM stdin;
1	1	1	1	01800123450001001000000122026112210676292234	generacion	pendiente	\N	DE generado, pendiente de envío	\N	\N	1	2026-11-22 20:29:34.842379+00
2	1	1	1	01800123450001001000000122026112210676292234	envio	enviado	\N	\N	<?xml version="1.0" encoding="UTF-8"?><rDE><DE Id="01800123450001001000000122026112210676292234"><dFecFirma>2026-11-22T20:29:34.882Z</dFecFirma><gTimb><iTiDE>1</iTiDE><dNumTim>18000001</dNumTim><dEst>001</dEst><dPunExp>001</dPunExp><dNumDoc>0000001</dNumDoc></gTimb><gEmis><dRucEm>80012345</dRucEm><dDVEmi>0</dDVEmi><dNomEmi>FERRETERÍA DEMO S.A.</dNomEmi></gEmis><gDatRec><dNomRec>JUAN PÉREZ</dNomRec><dNumIDRec>1234567</dNumIDRec></gDatRec><gDtipDE><gCamItem><dCodInt>9</dCodInt><dDesProSer>Cemento Portland bolsa 50 kg</dDesProSer><dCantProSer>1</dCantProSer><dPUniProSer>62000</dPUniProSer><dDescItem>0</dDescItem><dTotOpeItem>62000</dTotOpeItem><dLiqIVAItem>5636</dLiqIVAItem></gCamItem><gCamItem><dCodInt>4</dCodInt><dDesProSer>Taladro percutor 650 W 13 mm</dDesProSer><dCantProSer>1</dCantProSer><dPUniProSer>650000</dPUniProSer><dDescItem>0</dDescItem><dTotOpeItem>650000</dTotOpeItem><dLiqIVAItem>59091</dLiqIVAItem></gCamItem></gDtipDE><gTotSub><dTotGralOpe>712000</dTotGralOpe><dTotIVA>64727</dTotIVA></gTotSub></DE></rDE>	\N	1	2026-11-22 20:29:34.90795+00
3	1	1	1	01800123450001001000000122026112210676292234	respuesta	aprobado	0260	Autorización del DE satisfactoria (simulado)	\N	<rRetEnviDe><dCodRes>0260</dCodRes><Id>01800123450001001000000122026112210676292234</Id></rRetEnviDe>	1	2026-11-22 20:29:34.90795+00
4	1	1	1	01800123450001001000000122026112210676292234	cancelacion	cancelado	0600	Evento de cancelación registrado (simulado) 01800123450001001000000122026112210676292234: Mala impresion	\N	\N	1	2026-11-22 20:30:42.379409+00
5	1	1	4	01800123450001001000000222026112218561351685	generacion	pendiente	\N	DE generado, pendiente de envío	\N	\N	1	2026-11-22 20:33:52.255124+00
6	1	1	4	01800123450001001000000222026112218561351685	envio	enviado	\N	\N	<?xml version="1.0" encoding="UTF-8"?><rDE><DE Id="01800123450001001000000222026112218561351685"><dFecFirma>2026-11-22T20:33:52.275Z</dFecFirma><gTimb><iTiDE>1</iTiDE><dNumTim>18000001</dNumTim><dEst>001</dEst><dPunExp>001</dPunExp><dNumDoc>0000002</dNumDoc></gTimb><gEmis><dRucEm>80012345</dRucEm><dDVEmi>0</dDVEmi><dNomEmi>FERRETERÍA DEMO S.A.</dNomEmi></gEmis><gDatRec><dNomRec>DISTRIBUIDORA FERRETERA DEL SUR S.A.</dNomRec><dRucRec>80055550</dRucRec><dDVRec>3</dDVRec></gDatRec><gDtipDE><gCamItem><dCodInt>9</dCodInt><dDesProSer>Cemento Portland bolsa 50 kg</dDesProSer><dCantProSer>1</dCantProSer><dPUniProSer>62000</dPUniProSer><dDescItem>0</dDescItem><dTotOpeItem>62000</dTotOpeItem><dLiqIVAItem>5636</dLiqIVAItem></gCamItem></gDtipDE><gTotSub><dTotGralOpe>62000</dTotGralOpe><dTotIVA>5636</dTotIVA></gTotSub></DE></rDE>	\N	1	2026-11-22 20:33:52.29065+00
7	1	1	4	01800123450001001000000222026112218561351685	respuesta	aprobado	0260	Autorización del DE satisfactoria (simulado)	\N	<rRetEnviDe><dCodRes>0260</dCodRes><Id>01800123450001001000000222026112218561351685</Id></rRetEnviDe>	1	2026-11-22 20:33:52.29065+00
8	1	1	5	01800123450001001000000322026112214598597498	generacion	pendiente	\N	DE generado, pendiente de envío	\N	\N	1	2026-11-22 20:34:06.567983+00
9	1	1	5	01800123450001001000000322026112214598597498	envio	enviado	\N	\N	<?xml version="1.0" encoding="UTF-8"?><rDE><DE Id="01800123450001001000000322026112214598597498"><dFecFirma>2026-11-22T20:34:06.585Z</dFecFirma><gTimb><iTiDE>1</iTiDE><dNumTim>18000001</dNumTim><dEst>001</dEst><dPunExp>001</dPunExp><dNumDoc>0000003</dNumDoc></gTimb><gEmis><dRucEm>80012345</dRucEm><dDVEmi>0</dDVEmi><dNomEmi>FERRETERÍA DEMO S.A.</dNomEmi></gEmis><gDatRec><dNomRec>JUAN PÉREZ</dNomRec><dNumIDRec>1234567</dNumIDRec></gDatRec><gDtipDE><gCamItem><dCodInt>9</dCodInt><dDesProSer>Cemento Portland bolsa 50 kg</dDesProSer><dCantProSer>1</dCantProSer><dPUniProSer>62000</dPUniProSer><dDescItem>0</dDescItem><dTotOpeItem>62000</dTotOpeItem><dLiqIVAItem>5636</dLiqIVAItem></gCamItem></gDtipDE><gTotSub><dTotGralOpe>62000</dTotGralOpe><dTotIVA>5636</dTotIVA></gTotSub></DE></rDE>	\N	1	2026-11-22 20:34:06.598592+00
10	1	1	5	01800123450001001000000322026112214598597498	respuesta	aprobado	0260	Autorización del DE satisfactoria (simulado)	\N	<rRetEnviDe><dCodRes>0260</dCodRes><Id>01800123450001001000000322026112214598597498</Id></rRetEnviDe>	1	2026-11-22 20:34:06.598592+00
\.


--
-- Data for Name: stock; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.stock (id, empresa_id, sucursal_id, deposito_id, articulo_id, cantidad, cantidad_reservada, costo_promedio_gs, ultimo_costo_gs, actualizado_en) FROM stdin;
1	1	1	1	1	25.000	0.000	52000	52000	2026-11-22 19:58:04.29856+00
2	1	2	3	1	10.000	0.000	52000	52000	2026-11-22 19:58:04.29856+00
3	1	1	1	2	15.000	0.000	75000	75000	2026-11-22 19:58:04.29856+00
4	1	2	3	2	6.000	0.000	75000	75000	2026-11-22 19:58:04.29856+00
5	1	1	1	3	40.000	0.000	19000	19000	2026-11-22 19:58:04.29856+00
6	1	2	3	3	20.000	0.000	19000	19000	2026-11-22 19:58:04.29856+00
8	1	2	3	4	3.000	0.000	430000	430000	2026-11-22 19:58:04.29856+00
9	1	1	1	5	500.000	0.000	2700	2700	2026-11-22 19:58:04.29856+00
10	1	2	3	5	300.000	0.000	2700	2700	2026-11-22 19:58:04.29856+00
11	1	1	1	6	5000.000	0.000	150	150	2026-11-22 19:58:04.29856+00
12	1	2	3	6	2000.000	0.000	150	150	2026-11-22 19:58:04.29856+00
13	1	1	1	7	120.000	0.000	11000	11000	2026-11-22 19:58:04.29856+00
14	1	2	3	7	60.000	0.000	11000	11000	2026-11-22 19:58:04.29856+00
15	1	1	1	8	30.000	0.000	92000	92000	2026-11-22 19:58:04.29856+00
16	1	2	3	8	12.000	0.000	92000	92000	2026-11-22 19:58:04.29856+00
18	1	2	3	9	80.000	0.000	48000	48000	2026-11-22 19:58:04.29856+00
19	1	1	1	10	20.000	0.000	36000	36000	2026-11-22 19:58:04.29856+00
20	1	2	3	10	10.000	0.000	36000	36000	2026-11-22 19:58:04.29856+00
7	1	1	1	4	8.000	0.000	430000	430000	2026-11-22 20:30:42.388+00
17	1	1	1	9	198.000	0.000	48000	48000	2026-11-22 20:34:06.576+00
\.


--
-- Data for Name: sucursales; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sucursales (id, empresa_id, codigo, nombre, direccion, ciudad_id, telefono, email, es_casa_matriz, estado, creado_en, actualizado_en) FROM stdin;
1	1	001	Casa Matriz	Avda. Mariscal López 1234, Asunción	1	\N	\N	t	activo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
2	1	002	Sucursal San Lorenzo	Ruta PY02 km 12, San Lorenzo	22	\N	\N	f	activo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
\.


--
-- Data for Name: timbrados; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.timbrados (id, empresa_id, numero, modalidad, fecha_inicio_vigencia, fecha_fin_vigencia, estado, creado_en, actualizado_en) FROM stdin;
1	1	18000001	electronica	2026-01-01	\N	activo	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
\.


--
-- Data for Name: tipos_documento; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tipos_documento (id, codigo, nombre, codigo_sifen, requiere_dv, creado_en, actualizado_en) FROM stdin;
1	RUC	Registro Único del Contribuyente	\N	t	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
2	CI	Cédula de identidad paraguaya	1	f	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
3	PAS	Pasaporte	2	f	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
4	CIE	Cédula de identidad extranjera	3	f	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
5	INN	Innominado (sin nombre)	5	f	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
\.


--
-- Data for Name: tipos_persona; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tipos_persona (id, codigo, nombre, creado_en, actualizado_en) FROM stdin;
1	F	Persona física	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
2	J	Persona jurídica	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
\.


--
-- Data for Name: transferencia_stock_detalles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.transferencia_stock_detalles (id, empresa_id, sucursal_id, transferencia_stock_id, linea, articulo_id, cantidad, cantidad_recibida, costo_unitario_gs) FROM stdin;
\.


--
-- Data for Name: transferencias_stock; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.transferencias_stock (id, empresa_id, sucursal_id, sucursal_destino_id, deposito_origen_id, deposito_destino_id, numero, fecha, observacion, total_costo_gs, estado, enviado_por, enviado_en, recibido_por, recibido_en, creado_por, creado_en, actualizado_en, confirmado_por, confirmado_en, anulado_por, anulado_en, motivo_anulacion) FROM stdin;
\.


--
-- Data for Name: unidades_medida; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.unidades_medida (id, codigo, nombre, codigo_sifen, permite_decimales, creado_en, actualizado_en) FROM stdin;
1	UNI	Unidad	77	f	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
2	MTR	Metro	\N	t	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
3	M2	Metro cuadrado	\N	t	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
4	M3	Metro cúbico	\N	t	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
5	KG	Kilogramo	\N	t	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
6	LT	Litro	\N	t	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
7	GL	Galón	\N	f	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
8	CJ	Caja	\N	f	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
9	BLS	Bolsa	\N	f	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
10	ROL	Rollo	\N	f	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
11	PAR	Par	\N	f	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
12	PQT	Paquete	\N	f	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
\.


--
-- Data for Name: usuario_roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.usuario_roles (id, usuario_id, rol_id, sucursal_id, creado_en) FROM stdin;
1	1	1	\N	2026-11-22 19:58:04.29856+00
2	2	2	\N	2026-11-22 19:58:04.29856+00
3	3	3	\N	2026-11-22 19:58:04.29856+00
4	4	4	\N	2026-11-22 19:58:04.29856+00
5	5	5	\N	2026-11-22 19:58:04.29856+00
\.


--
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.usuarios (id, empresa_id, usuario, nombre, email, password_hash, sucursal_predeterminada_id, estado, ultimo_acceso_en, creado_en, actualizado_en) FROM stdin;
2	1	vendedor	Vendedor Demo	vendedor@ferreteria-demo.com.py	scrypt$16384$8$1$2ab66ab3611fff7a3bcda8385c2b7814$7d5ba864bee9898c75d78a297130b62a183f11e079699198ba59b5343a241a6844159253de3d084f6643f82709c8c0df3b83f56254322e590f4199b7d515b8d7	1	activo	\N	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
3	1	cajero	Cajero Demo	cajero@ferreteria-demo.com.py	scrypt$16384$8$1$43c103c2f63d403f6cc9ec8f409d6bf7$aab70b756bb0d9838b60de6b23b3f4fdc9736d477cf034923070729a032c1fb7db3a5e408bc444e18ffcbd3c6646726fa83665b06a2a7a0dd4f580510cb41f9f	1	activo	\N	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
4	1	compras	Compras Demo	compras@ferreteria-demo.com.py	scrypt$16384$8$1$06164eec1326673ec9f06b346be43e5c$c791bfe79d34eb359881a48bfc91016fcd95c97552b883ba998beb08eb4048e20363fcc21ad9554eff92b3241fbc63f14bc8f59c3cc70cedfb41049e603f7b57	1	activo	\N	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
5	1	contador	Contador Demo	contador@ferreteria-demo.com.py	scrypt$16384$8$1$b6f3c16827515ff97326ebb18a5bfd40$29a3ed1f17603386ed75d1ef658591413d621027fabac49fc4753c9cbc2b0c6bb036a1ac14d09ea8b21777623510b64741b075e0086ef789a8d1c7547f262844	1	activo	\N	2026-11-22 19:58:04.29856+00	2026-11-22 19:58:04.29856+00
1	1	admin	Administrador Demo	admin@ferreteria-demo.com.py	scrypt$16384$8$1$5423012fa79944f91a9363c852bc439f$3ceb28f6b81f02b5790f672524ef32189f117df01f483143ed7ff0633feee7aa1540299fa804ebcf7947e5ddded932c32c6e193b323a2144b69217be31cf3f9e	1	activo	2026-11-22 20:03:01.161+00	2026-11-22 19:58:04.29856+00	2026-11-22 20:03:01.162+00
\.


--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE SET; Schema: drizzle; Owner: -
--

SELECT pg_catalog.setval('drizzle.__drizzle_migrations_id_seq', 2, true);


--
-- Name: actividades_economicas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.actividades_economicas_id_seq', 3, true);


--
-- Name: ajuste_stock_detalles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.ajuste_stock_detalles_id_seq', 1, false);


--
-- Name: ajustes_stock_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.ajustes_stock_id_seq', 1, false);


--
-- Name: arqueos_caja_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.arqueos_caja_id_seq', 1, false);


--
-- Name: articulo_unidades_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.articulo_unidades_id_seq', 2, true);


--
-- Name: articulos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.articulos_id_seq', 10, true);


--
-- Name: asientos_contables_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.asientos_contables_id_seq', 4, true);


--
-- Name: cajas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.cajas_id_seq', 2, true);


--
-- Name: categorias_articulo_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.categorias_articulo_id_seq', 8, true);


--
-- Name: ciudades_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.ciudades_id_seq', 40, true);


--
-- Name: clientes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.clientes_id_seq', 4, true);


--
-- Name: cobro_detalles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.cobro_detalles_id_seq', 1, false);


--
-- Name: cobro_medios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.cobro_medios_id_seq', 1, false);


--
-- Name: cobros_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.cobros_id_seq', 1, false);


--
-- Name: condiciones_pago_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.condiciones_pago_id_seq', 3, true);


--
-- Name: configuracion_contable_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.configuracion_contable_id_seq', 29, true);


--
-- Name: configuracion_sifen_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.configuracion_sifen_id_seq', 1, true);


--
-- Name: cuentas_cobrar_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.cuentas_cobrar_id_seq', 3, true);


--
-- Name: cuentas_pagar_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.cuentas_pagar_id_seq', 1, false);


--
-- Name: cuotas_venta_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.cuotas_venta_id_seq', 1, false);


--
-- Name: departamentos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.departamentos_id_seq', 18, true);


--
-- Name: depositos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.depositos_id_seq', 3, true);


--
-- Name: descuento_articulos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.descuento_articulos_id_seq', 3, true);


--
-- Name: descuento_sucursales_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.descuento_sucursales_id_seq', 2, true);


--
-- Name: descuentos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.descuentos_id_seq', 1, true);


--
-- Name: detalles_asiento_contable_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.detalles_asiento_contable_id_seq', 20, true);


--
-- Name: empresas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.empresas_id_seq', 1, true);


--
-- Name: establecimientos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.establecimientos_id_seq', 2, true);


--
-- Name: factura_compra_detalles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.factura_compra_detalles_id_seq', 1, false);


--
-- Name: factura_venta_detalles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.factura_venta_detalles_id_seq', 10, true);


--
-- Name: facturas_compra_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.facturas_compra_id_seq', 1, false);


--
-- Name: facturas_venta_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.facturas_venta_id_seq', 5, true);


--
-- Name: historico_costos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.historico_costos_id_seq', 1, false);


--
-- Name: kardex_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.kardex_id_seq', 26, true);


--
-- Name: marcas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.marcas_id_seq', 5, true);


--
-- Name: modelos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.modelos_id_seq', 1, false);


--
-- Name: numeraciones_documento_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.numeraciones_documento_id_seq', 4, true);


--
-- Name: orden_compra_detalles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.orden_compra_detalles_id_seq', 1, false);


--
-- Name: orden_pago_detalles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.orden_pago_detalles_id_seq', 1, false);


--
-- Name: ordenes_compra_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.ordenes_compra_id_seq', 1, false);


--
-- Name: ordenes_pago_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.ordenes_pago_id_seq', 1, false);


--
-- Name: paises_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.paises_id_seq', 6, true);


--
-- Name: parametros_generales_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.parametros_generales_id_seq', 7, true);


--
-- Name: pedido_compra_detalles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.pedido_compra_detalles_id_seq', 1, false);


--
-- Name: pedidos_compra_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.pedidos_compra_id_seq', 1, false);


--
-- Name: permisos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.permisos_id_seq', 56, true);


--
-- Name: personas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.personas_id_seq', 5, true);


--
-- Name: plan_cuentas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.plan_cuentas_id_seq', 42, true);


--
-- Name: presupuesto_detalles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.presupuesto_detalles_id_seq', 10, true);


--
-- Name: presupuestos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.presupuestos_id_seq', 3, true);


--
-- Name: proveedores_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.proveedores_id_seq', 3, true);


--
-- Name: puntos_expedicion_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.puntos_expedicion_id_seq', 2, true);


--
-- Name: recepcion_detalles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.recepcion_detalles_id_seq', 1, false);


--
-- Name: recepciones_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.recepciones_id_seq', 1, false);


--
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.roles_id_seq', 5, true);


--
-- Name: sesiones_caja_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sesiones_caja_id_seq', 1, false);


--
-- Name: sifen_eventos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sifen_eventos_id_seq', 10, true);


--
-- Name: stock_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.stock_id_seq', 20, true);


--
-- Name: sucursales_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sucursales_id_seq', 2, true);


--
-- Name: timbrados_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.timbrados_id_seq', 1, true);


--
-- Name: tipos_documento_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.tipos_documento_id_seq', 5, true);


--
-- Name: tipos_persona_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.tipos_persona_id_seq', 2, true);


--
-- Name: transferencia_stock_detalles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.transferencia_stock_detalles_id_seq', 1, false);


--
-- Name: transferencias_stock_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.transferencias_stock_id_seq', 1, false);


--
-- Name: unidades_medida_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.unidades_medida_id_seq', 12, true);


--
-- Name: usuario_roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.usuario_roles_id_seq', 5, true);


--
-- Name: usuarios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.usuarios_id_seq', 5, true);


--
-- Name: __drizzle_migrations __drizzle_migrations_pkey; Type: CONSTRAINT; Schema: drizzle; Owner: -
--

ALTER TABLE ONLY drizzle.__drizzle_migrations
    ADD CONSTRAINT __drizzle_migrations_pkey PRIMARY KEY (id);


--
-- Name: actividades_economicas actividades_economicas_codigo_uq; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.actividades_economicas
    ADD CONSTRAINT actividades_economicas_codigo_uq UNIQUE (codigo);


--
-- Name: actividades_economicas actividades_economicas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.actividades_economicas
    ADD CONSTRAINT actividades_economicas_pkey PRIMARY KEY (id);


--
-- Name: ajuste_stock_detalles ajuste_stock_detalles_linea_uq; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ajuste_stock_detalles
    ADD CONSTRAINT ajuste_stock_detalles_linea_uq UNIQUE (ajuste_stock_id, linea);


--
-- Name: ajuste_stock_detalles ajuste_stock_detalles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ajuste_stock_detalles
    ADD CONSTRAINT ajuste_stock_detalles_pkey PRIMARY KEY (id);


--
-- Name: ajustes_stock ajustes_stock_numero_uq; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ajustes_stock
    ADD CONSTRAINT ajustes_stock_numero_uq UNIQUE (empresa_id, sucursal_id, numero);


--
-- Name: ajustes_stock ajustes_stock_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ajustes_stock
    ADD CONSTRAINT ajustes_stock_pkey PRIMARY KEY (id);


--
-- Name: arqueos_caja arqueos_caja_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.arqueos_caja
    ADD CONSTRAINT arqueos_caja_pkey PRIMARY KEY (id);


--
-- Name: arqueos_caja arqueos_caja_uq; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.arqueos_caja
    ADD CONSTRAINT arqueos_caja_uq UNIQUE (sesion_caja_id, medio_pago);


--
-- Name: articulo_unidades articulo_unidades_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.articulo_unidades
    ADD CONSTRAINT articulo_unidades_pkey PRIMARY KEY (id);


--
-- Name: articulo_unidades articulo_unidades_uq; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.articulo_unidades
    ADD CONSTRAINT articulo_unidades_uq UNIQUE (articulo_id, unidad_medida_id);


--
-- Name: articulos articulos_empresa_codigo_uq; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.articulos
    ADD CONSTRAINT articulos_empresa_codigo_uq UNIQUE (empresa_id, codigo);


--
-- Name: articulos articulos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.articulos
    ADD CONSTRAINT articulos_pkey PRIMARY KEY (id);


--
-- Name: asientos_contables asientos_contables_numero_uq; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asientos_contables
    ADD CONSTRAINT asientos_contables_numero_uq UNIQUE (empresa_id, numero);


--
-- Name: asientos_contables asientos_contables_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asientos_contables
    ADD CONSTRAINT asientos_contables_pkey PRIMARY KEY (id);


--
-- Name: cajas cajas_codigo_uq; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cajas
    ADD CONSTRAINT cajas_codigo_uq UNIQUE (empresa_id, sucursal_id, codigo);


--
-- Name: cajas cajas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cajas
    ADD CONSTRAINT cajas_pkey PRIMARY KEY (id);


--
-- Name: categorias_articulo categorias_articulo_empresa_codigo_uq; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categorias_articulo
    ADD CONSTRAINT categorias_articulo_empresa_codigo_uq UNIQUE (empresa_id, codigo);


--
-- Name: categorias_articulo categorias_articulo_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categorias_articulo
    ADD CONSTRAINT categorias_articulo_pkey PRIMARY KEY (id);


--
-- Name: ciudades ciudades_depto_nombre_uq; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ciudades
    ADD CONSTRAINT ciudades_depto_nombre_uq UNIQUE (departamento_id, nombre);


--
-- Name: ciudades ciudades_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ciudades
    ADD CONSTRAINT ciudades_pkey PRIMARY KEY (id);


--
-- Name: clientes clientes_empresa_persona_uq; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_empresa_persona_uq UNIQUE (empresa_id, persona_id);


--
-- Name: clientes clientes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_pkey PRIMARY KEY (id);


--
-- Name: cobro_detalles cobro_detalles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cobro_detalles
    ADD CONSTRAINT cobro_detalles_pkey PRIMARY KEY (id);


--
-- Name: cobro_detalles cobro_detalles_uq; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cobro_detalles
    ADD CONSTRAINT cobro_detalles_uq UNIQUE (cobro_id, cuenta_cobrar_id);


--
-- Name: cobro_medios cobro_medios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cobro_medios
    ADD CONSTRAINT cobro_medios_pkey PRIMARY KEY (id);


--
-- Name: cobros cobros_numero_uq; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cobros
    ADD CONSTRAINT cobros_numero_uq UNIQUE (empresa_id, sucursal_id, numero);


--
-- Name: cobros cobros_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cobros
    ADD CONSTRAINT cobros_pkey PRIMARY KEY (id);


--
-- Name: condiciones_pago condiciones_pago_empresa_codigo_uq; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.condiciones_pago
    ADD CONSTRAINT condiciones_pago_empresa_codigo_uq UNIQUE (empresa_id, codigo);


--
-- Name: condiciones_pago condiciones_pago_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.condiciones_pago
    ADD CONSTRAINT condiciones_pago_pkey PRIMARY KEY (id);


--
-- Name: configuracion_contable configuracion_contable_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.configuracion_contable
    ADD CONSTRAINT configuracion_contable_pkey PRIMARY KEY (id);


--
-- Name: configuracion_contable configuracion_contable_uq; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.configuracion_contable
    ADD CONSTRAINT configuracion_contable_uq UNIQUE (empresa_id, operacion, concepto);


--
-- Name: configuracion_sifen configuracion_sifen_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.configuracion_sifen
    ADD CONSTRAINT configuracion_sifen_pkey PRIMARY KEY (id);


--
-- Name: configuracion_sifen configuracion_sifen_uq; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.configuracion_sifen
    ADD CONSTRAINT configuracion_sifen_uq UNIQUE NULLS NOT DISTINCT (empresa_id, sucursal_id);


--
-- Name: cuentas_cobrar cuentas_cobrar_cuota_uq; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cuentas_cobrar
    ADD CONSTRAINT cuentas_cobrar_cuota_uq UNIQUE (factura_venta_id, numero_cuota);


--
-- Name: cuentas_cobrar cuentas_cobrar_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cuentas_cobrar
    ADD CONSTRAINT cuentas_cobrar_pkey PRIMARY KEY (id);


--
-- Name: cuentas_pagar cuentas_pagar_cuota_uq; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cuentas_pagar
    ADD CONSTRAINT cuentas_pagar_cuota_uq UNIQUE (factura_compra_id, numero_cuota);


--
-- Name: cuentas_pagar cuentas_pagar_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cuentas_pagar
    ADD CONSTRAINT cuentas_pagar_pkey PRIMARY KEY (id);


--
-- Name: cuotas_venta cuotas_venta_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cuotas_venta
    ADD CONSTRAINT cuotas_venta_pkey PRIMARY KEY (id);


--
-- Name: cuotas_venta cuotas_venta_uq; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cuotas_venta
    ADD CONSTRAINT cuotas_venta_uq UNIQUE (factura_venta_id, numero_cuota);


--
-- Name: departamentos departamentos_pais_codigo_uq; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departamentos
    ADD CONSTRAINT departamentos_pais_codigo_uq UNIQUE (pais_id, codigo);


--
-- Name: departamentos departamentos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departamentos
    ADD CONSTRAINT departamentos_pkey PRIMARY KEY (id);


--
-- Name: depositos depositos_empresa_codigo_uq; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.depositos
    ADD CONSTRAINT depositos_empresa_codigo_uq UNIQUE (empresa_id, codigo);


--
-- Name: depositos depositos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.depositos
    ADD CONSTRAINT depositos_pkey PRIMARY KEY (id);


--
-- Name: descuento_articulos descuento_articulos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.descuento_articulos
    ADD CONSTRAINT descuento_articulos_pkey PRIMARY KEY (id);


--
-- Name: descuento_articulos descuento_articulos_uq; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.descuento_articulos
    ADD CONSTRAINT descuento_articulos_uq UNIQUE (descuento_id, articulo_id);


--
-- Name: descuento_sucursales descuento_sucursales_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.descuento_sucursales
    ADD CONSTRAINT descuento_sucursales_pkey PRIMARY KEY (id);


--
-- Name: descuento_sucursales descuento_sucursales_uq; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.descuento_sucursales
    ADD CONSTRAINT descuento_sucursales_uq UNIQUE (descuento_id, sucursal_id);


--
-- Name: descuentos descuentos_empresa_codigo_uq; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.descuentos
    ADD CONSTRAINT descuentos_empresa_codigo_uq UNIQUE (empresa_id, codigo);


--
-- Name: descuentos descuentos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.descuentos
    ADD CONSTRAINT descuentos_pkey PRIMARY KEY (id);


--
-- Name: detalles_asiento_contable detalles_asiento_contable_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detalles_asiento_contable
    ADD CONSTRAINT detalles_asiento_contable_pkey PRIMARY KEY (id);


--
-- Name: detalles_asiento_contable detalles_asiento_linea_uq; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detalles_asiento_contable
    ADD CONSTRAINT detalles_asiento_linea_uq UNIQUE (asiento_id, linea);


--
-- Name: empresas empresas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empresas
    ADD CONSTRAINT empresas_pkey PRIMARY KEY (id);


--
-- Name: empresas empresas_ruc_uq; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empresas
    ADD CONSTRAINT empresas_ruc_uq UNIQUE (ruc);


--
-- Name: establecimientos establecimientos_empresa_codigo_uq; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.establecimientos
    ADD CONSTRAINT establecimientos_empresa_codigo_uq UNIQUE (empresa_id, codigo);


--
-- Name: establecimientos establecimientos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.establecimientos
    ADD CONSTRAINT establecimientos_pkey PRIMARY KEY (id);


--
-- Name: factura_compra_detalles factura_compra_detalles_linea_uq; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.factura_compra_detalles
    ADD CONSTRAINT factura_compra_detalles_linea_uq UNIQUE (factura_compra_id, linea);


--
-- Name: factura_compra_detalles factura_compra_detalles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.factura_compra_detalles
    ADD CONSTRAINT factura_compra_detalles_pkey PRIMARY KEY (id);


--
-- Name: factura_venta_detalles factura_venta_detalles_linea_uq; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.factura_venta_detalles
    ADD CONSTRAINT factura_venta_detalles_linea_uq UNIQUE (factura_venta_id, linea);


--
-- Name: factura_venta_detalles factura_venta_detalles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.factura_venta_detalles
    ADD CONSTRAINT factura_venta_detalles_pkey PRIMARY KEY (id);


--
-- Name: facturas_compra facturas_compra_comprobante_uq; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.facturas_compra
    ADD CONSTRAINT facturas_compra_comprobante_uq UNIQUE (empresa_id, proveedor_id, timbrado, establecimiento, punto_expedicion, numero);


--
-- Name: facturas_compra facturas_compra_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.facturas_compra
    ADD CONSTRAINT facturas_compra_pkey PRIMARY KEY (id);


--
-- Name: facturas_venta facturas_venta_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.facturas_venta
    ADD CONSTRAINT facturas_venta_pkey PRIMARY KEY (id);


--
-- Name: historico_costos historico_costos_detalle_fc_uq; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historico_costos
    ADD CONSTRAINT historico_costos_detalle_fc_uq UNIQUE (detalle_factura_compra_id);


--
-- Name: historico_costos historico_costos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historico_costos
    ADD CONSTRAINT historico_costos_pkey PRIMARY KEY (id);


--
-- Name: kardex kardex_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kardex
    ADD CONSTRAINT kardex_pkey PRIMARY KEY (id);


--
-- Name: marcas marcas_empresa_nombre_uq; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marcas
    ADD CONSTRAINT marcas_empresa_nombre_uq UNIQUE (empresa_id, nombre);


--
-- Name: marcas marcas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marcas
    ADD CONSTRAINT marcas_pkey PRIMARY KEY (id);


--
-- Name: modelos modelos_marca_nombre_uq; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.modelos
    ADD CONSTRAINT modelos_marca_nombre_uq UNIQUE (marca_id, nombre);


--
-- Name: modelos modelos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.modelos
    ADD CONSTRAINT modelos_pkey PRIMARY KEY (id);


--
-- Name: numeraciones_documento numeraciones_doc_uq; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.numeraciones_documento
    ADD CONSTRAINT numeraciones_doc_uq UNIQUE (timbrado_id, punto_expedicion_id, tipo_documento);


--
-- Name: numeraciones_documento numeraciones_documento_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.numeraciones_documento
    ADD CONSTRAINT numeraciones_documento_pkey PRIMARY KEY (id);


--
-- Name: orden_compra_detalles orden_compra_detalles_linea_uq; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orden_compra_detalles
    ADD CONSTRAINT orden_compra_detalles_linea_uq UNIQUE (orden_compra_id, linea);


--
-- Name: orden_compra_detalles orden_compra_detalles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orden_compra_detalles
    ADD CONSTRAINT orden_compra_detalles_pkey PRIMARY KEY (id);


--
-- Name: orden_compra_pedidos orden_compra_pedidos_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orden_compra_pedidos
    ADD CONSTRAINT orden_compra_pedidos_pk PRIMARY KEY (orden_compra_id, pedido_compra_id);


--
-- Name: orden_pago_detalles orden_pago_detalles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orden_pago_detalles
    ADD CONSTRAINT orden_pago_detalles_pkey PRIMARY KEY (id);


--
-- Name: orden_pago_detalles orden_pago_detalles_uq; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orden_pago_detalles
    ADD CONSTRAINT orden_pago_detalles_uq UNIQUE (orden_pago_id, cuenta_pagar_id);


--
-- Name: ordenes_compra ordenes_compra_numero_uq; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ordenes_compra
    ADD CONSTRAINT ordenes_compra_numero_uq UNIQUE (empresa_id, sucursal_id, numero);


--
-- Name: ordenes_compra ordenes_compra_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ordenes_compra
    ADD CONSTRAINT ordenes_compra_pkey PRIMARY KEY (id);


--
-- Name: ordenes_pago ordenes_pago_numero_uq; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ordenes_pago
    ADD CONSTRAINT ordenes_pago_numero_uq UNIQUE (empresa_id, sucursal_id, numero);


--
-- Name: ordenes_pago ordenes_pago_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ordenes_pago
    ADD CONSTRAINT ordenes_pago_pkey PRIMARY KEY (id);


--
-- Name: paises paises_codigo_iso_uq; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.paises
    ADD CONSTRAINT paises_codigo_iso_uq UNIQUE (codigo_iso);


--
-- Name: paises paises_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.paises
    ADD CONSTRAINT paises_pkey PRIMARY KEY (id);


--
-- Name: parametros_generales parametros_generales_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parametros_generales
    ADD CONSTRAINT parametros_generales_pkey PRIMARY KEY (id);


--
-- Name: parametros_generales parametros_generales_uq; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parametros_generales
    ADD CONSTRAINT parametros_generales_uq UNIQUE NULLS NOT DISTINCT (empresa_id, sucursal_id, clave);


--
-- Name: pedido_compra_detalles pedido_compra_detalles_linea_uq; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pedido_compra_detalles
    ADD CONSTRAINT pedido_compra_detalles_linea_uq UNIQUE (pedido_compra_id, linea);


--
-- Name: pedido_compra_detalles pedido_compra_detalles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pedido_compra_detalles
    ADD CONSTRAINT pedido_compra_detalles_pkey PRIMARY KEY (id);


--
-- Name: pedidos_compra pedidos_compra_numero_uq; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pedidos_compra
    ADD CONSTRAINT pedidos_compra_numero_uq UNIQUE (empresa_id, sucursal_id, numero);


--
-- Name: pedidos_compra pedidos_compra_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pedidos_compra
    ADD CONSTRAINT pedidos_compra_pkey PRIMARY KEY (id);


--
-- Name: permisos permisos_codigo_uq; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permisos
    ADD CONSTRAINT permisos_codigo_uq UNIQUE (codigo);


--
-- Name: permisos permisos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permisos
    ADD CONSTRAINT permisos_pkey PRIMARY KEY (id);


--
-- Name: personas personas_empresa_documento_uq; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personas
    ADD CONSTRAINT personas_empresa_documento_uq UNIQUE (empresa_id, tipo_documento_id, numero_documento);


--
-- Name: personas personas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personas
    ADD CONSTRAINT personas_pkey PRIMARY KEY (id);


--
-- Name: plan_cuentas plan_cuentas_empresa_codigo_uq; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plan_cuentas
    ADD CONSTRAINT plan_cuentas_empresa_codigo_uq UNIQUE (empresa_id, codigo);


--
-- Name: plan_cuentas plan_cuentas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plan_cuentas
    ADD CONSTRAINT plan_cuentas_pkey PRIMARY KEY (id);


--
-- Name: presupuesto_detalles presupuesto_detalles_linea_uq; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.presupuesto_detalles
    ADD CONSTRAINT presupuesto_detalles_linea_uq UNIQUE (presupuesto_id, linea);


--
-- Name: presupuesto_detalles presupuesto_detalles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.presupuesto_detalles
    ADD CONSTRAINT presupuesto_detalles_pkey PRIMARY KEY (id);


--
-- Name: presupuestos presupuestos_numero_uq; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.presupuestos
    ADD CONSTRAINT presupuestos_numero_uq UNIQUE (empresa_id, sucursal_id, numero);


--
-- Name: presupuestos presupuestos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.presupuestos
    ADD CONSTRAINT presupuestos_pkey PRIMARY KEY (id);


--
-- Name: proveedores proveedores_empresa_persona_uq; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proveedores
    ADD CONSTRAINT proveedores_empresa_persona_uq UNIQUE (empresa_id, persona_id);


--
-- Name: proveedores proveedores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proveedores
    ADD CONSTRAINT proveedores_pkey PRIMARY KEY (id);


--
-- Name: puntos_expedicion puntos_expedicion_estab_codigo_uq; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.puntos_expedicion
    ADD CONSTRAINT puntos_expedicion_estab_codigo_uq UNIQUE (establecimiento_id, codigo);


--
-- Name: puntos_expedicion puntos_expedicion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.puntos_expedicion
    ADD CONSTRAINT puntos_expedicion_pkey PRIMARY KEY (id);


--
-- Name: recepcion_detalles recepcion_detalles_linea_uq; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recepcion_detalles
    ADD CONSTRAINT recepcion_detalles_linea_uq UNIQUE (recepcion_id, linea);


--
-- Name: recepcion_detalles recepcion_detalles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recepcion_detalles
    ADD CONSTRAINT recepcion_detalles_pkey PRIMARY KEY (id);


--
-- Name: recepciones recepciones_numero_uq; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recepciones
    ADD CONSTRAINT recepciones_numero_uq UNIQUE (empresa_id, sucursal_id, numero);


--
-- Name: recepciones recepciones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recepciones
    ADD CONSTRAINT recepciones_pkey PRIMARY KEY (id);


--
-- Name: rol_permisos rol_permisos_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rol_permisos
    ADD CONSTRAINT rol_permisos_pk PRIMARY KEY (rol_id, permiso_id);


--
-- Name: roles roles_empresa_codigo_uq; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_empresa_codigo_uq UNIQUE (empresa_id, codigo);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: sesiones_caja sesiones_caja_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sesiones_caja
    ADD CONSTRAINT sesiones_caja_pkey PRIMARY KEY (id);


--
-- Name: sifen_eventos sifen_eventos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sifen_eventos
    ADD CONSTRAINT sifen_eventos_pkey PRIMARY KEY (id);


--
-- Name: stock stock_deposito_articulo_uq; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock
    ADD CONSTRAINT stock_deposito_articulo_uq UNIQUE (deposito_id, articulo_id);


--
-- Name: stock stock_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock
    ADD CONSTRAINT stock_pkey PRIMARY KEY (id);


--
-- Name: sucursales sucursales_empresa_codigo_uq; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sucursales
    ADD CONSTRAINT sucursales_empresa_codigo_uq UNIQUE (empresa_id, codigo);


--
-- Name: sucursales sucursales_id_empresa_uq; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sucursales
    ADD CONSTRAINT sucursales_id_empresa_uq UNIQUE (id, empresa_id);


--
-- Name: sucursales sucursales_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sucursales
    ADD CONSTRAINT sucursales_pkey PRIMARY KEY (id);


--
-- Name: timbrados timbrados_empresa_numero_uq; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.timbrados
    ADD CONSTRAINT timbrados_empresa_numero_uq UNIQUE (empresa_id, numero);


--
-- Name: timbrados timbrados_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.timbrados
    ADD CONSTRAINT timbrados_pkey PRIMARY KEY (id);


--
-- Name: tipos_documento tipos_documento_codigo_uq; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipos_documento
    ADD CONSTRAINT tipos_documento_codigo_uq UNIQUE (codigo);


--
-- Name: tipos_documento tipos_documento_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipos_documento
    ADD CONSTRAINT tipos_documento_pkey PRIMARY KEY (id);


--
-- Name: tipos_persona tipos_persona_codigo_uq; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipos_persona
    ADD CONSTRAINT tipos_persona_codigo_uq UNIQUE (codigo);


--
-- Name: tipos_persona tipos_persona_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipos_persona
    ADD CONSTRAINT tipos_persona_pkey PRIMARY KEY (id);


--
-- Name: transferencia_stock_detalles transferencia_stock_detalles_linea_uq; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transferencia_stock_detalles
    ADD CONSTRAINT transferencia_stock_detalles_linea_uq UNIQUE (transferencia_stock_id, linea);


--
-- Name: transferencia_stock_detalles transferencia_stock_detalles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transferencia_stock_detalles
    ADD CONSTRAINT transferencia_stock_detalles_pkey PRIMARY KEY (id);


--
-- Name: transferencias_stock transferencias_stock_numero_uq; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transferencias_stock
    ADD CONSTRAINT transferencias_stock_numero_uq UNIQUE (empresa_id, sucursal_id, numero);


--
-- Name: transferencias_stock transferencias_stock_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transferencias_stock
    ADD CONSTRAINT transferencias_stock_pkey PRIMARY KEY (id);


--
-- Name: unidades_medida unidades_medida_codigo_uq; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unidades_medida
    ADD CONSTRAINT unidades_medida_codigo_uq UNIQUE (codigo);


--
-- Name: unidades_medida unidades_medida_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unidades_medida
    ADD CONSTRAINT unidades_medida_pkey PRIMARY KEY (id);


--
-- Name: usuario_roles usuario_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuario_roles
    ADD CONSTRAINT usuario_roles_pkey PRIMARY KEY (id);


--
-- Name: usuario_roles usuario_roles_uq; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuario_roles
    ADD CONSTRAINT usuario_roles_uq UNIQUE NULLS NOT DISTINCT (usuario_id, rol_id, sucursal_id);


--
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- Name: usuarios usuarios_usuario_uq; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_usuario_uq UNIQUE (usuario);


--
-- Name: ajustes_stock_fecha_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ajustes_stock_fecha_idx ON public.ajustes_stock USING btree (empresa_id, sucursal_id, fecha);


--
-- Name: articulo_unidades_barras_uq; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX articulo_unidades_barras_uq ON public.articulo_unidades USING btree (empresa_id, codigo_barras) WHERE (codigo_barras IS NOT NULL);


--
-- Name: articulos_categoria_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX articulos_categoria_idx ON public.articulos USING btree (categoria_id);


--
-- Name: articulos_descripcion_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX articulos_descripcion_idx ON public.articulos USING btree (empresa_id, descripcion);


--
-- Name: articulos_empresa_barras_uq; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX articulos_empresa_barras_uq ON public.articulos USING btree (empresa_id, codigo_barras) WHERE (codigo_barras IS NOT NULL);


--
-- Name: asientos_contables_fecha_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX asientos_contables_fecha_idx ON public.asientos_contables USING btree (empresa_id, fecha);


--
-- Name: asientos_contables_origen_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX asientos_contables_origen_idx ON public.asientos_contables USING btree (origen_tipo, origen_id);


--
-- Name: cobro_medios_cobro_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cobro_medios_cobro_idx ON public.cobro_medios USING btree (cobro_id);


--
-- Name: cobros_cliente_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cobros_cliente_idx ON public.cobros USING btree (empresa_id, cliente_id);


--
-- Name: cobros_sesion_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cobros_sesion_idx ON public.cobros USING btree (sesion_caja_id);


--
-- Name: cuentas_cobrar_cliente_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cuentas_cobrar_cliente_idx ON public.cuentas_cobrar USING btree (empresa_id, cliente_id, estado);


--
-- Name: cuentas_cobrar_cuota_venta_uq; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX cuentas_cobrar_cuota_venta_uq ON public.cuentas_cobrar USING btree (cuota_venta_id) WHERE (cuota_venta_id IS NOT NULL);


--
-- Name: cuentas_cobrar_vencimiento_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cuentas_cobrar_vencimiento_idx ON public.cuentas_cobrar USING btree (empresa_id, fecha_vencimiento);


--
-- Name: cuentas_pagar_proveedor_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cuentas_pagar_proveedor_idx ON public.cuentas_pagar USING btree (empresa_id, proveedor_id, estado);


--
-- Name: cuentas_pagar_vencimiento_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cuentas_pagar_vencimiento_idx ON public.cuentas_pagar USING btree (empresa_id, fecha_vencimiento);


--
-- Name: depositos_principal_uq; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX depositos_principal_uq ON public.depositos USING btree (sucursal_id) WHERE (es_principal = true);


--
-- Name: descuento_articulos_articulo_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX descuento_articulos_articulo_idx ON public.descuento_articulos USING btree (articulo_id, descuento_id);


--
-- Name: descuento_sucursales_sucursal_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX descuento_sucursales_sucursal_idx ON public.descuento_sucursales USING btree (sucursal_id, descuento_id);


--
-- Name: descuentos_vigencia_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX descuentos_vigencia_idx ON public.descuentos USING btree (empresa_id, estado, fecha_desde, fecha_hasta);


--
-- Name: detalles_asiento_cuenta_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX detalles_asiento_cuenta_idx ON public.detalles_asiento_contable USING btree (cuenta_id);


--
-- Name: factura_compra_detalles_origen_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX factura_compra_detalles_origen_idx ON public.factura_compra_detalles USING btree (detalle_origen_id);


--
-- Name: factura_venta_detalles_articulo_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX factura_venta_detalles_articulo_idx ON public.factura_venta_detalles USING btree (articulo_id);


--
-- Name: factura_venta_detalles_origen_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX factura_venta_detalles_origen_idx ON public.factura_venta_detalles USING btree (detalle_origen_id);


--
-- Name: facturas_compra_cdc_uq; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX facturas_compra_cdc_uq ON public.facturas_compra USING btree (cdc) WHERE (cdc IS NOT NULL);


--
-- Name: facturas_compra_fecha_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX facturas_compra_fecha_idx ON public.facturas_compra USING btree (empresa_id, sucursal_id, fecha_emision);


--
-- Name: facturas_venta_cdc_uq; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX facturas_venta_cdc_uq ON public.facturas_venta USING btree (cdc) WHERE (cdc IS NOT NULL);


--
-- Name: facturas_venta_cliente_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX facturas_venta_cliente_idx ON public.facturas_venta USING btree (empresa_id, cliente_id);


--
-- Name: facturas_venta_estado_sifen_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX facturas_venta_estado_sifen_idx ON public.facturas_venta USING btree (empresa_id, estado_sifen);


--
-- Name: facturas_venta_fecha_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX facturas_venta_fecha_idx ON public.facturas_venta USING btree (empresa_id, sucursal_id, fecha_emision);


--
-- Name: facturas_venta_numero_uq; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX facturas_venta_numero_uq ON public.facturas_venta USING btree (empresa_id, timbrado, establecimiento, punto_expedicion, numero) WHERE (numero IS NOT NULL);


--
-- Name: historico_costos_articulo_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX historico_costos_articulo_idx ON public.historico_costos USING btree (articulo_id, fecha);


--
-- Name: kardex_articulo_deposito_fecha_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX kardex_articulo_deposito_fecha_idx ON public.kardex USING btree (articulo_id, deposito_id, fecha);


--
-- Name: kardex_origen_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX kardex_origen_idx ON public.kardex USING btree (origen_tipo, origen_id);


--
-- Name: orden_compra_detalles_origen_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX orden_compra_detalles_origen_idx ON public.orden_compra_detalles USING btree (detalle_origen_id);


--
-- Name: ordenes_compra_proveedor_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ordenes_compra_proveedor_idx ON public.ordenes_compra USING btree (empresa_id, proveedor_id, estado);


--
-- Name: ordenes_pago_proveedor_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ordenes_pago_proveedor_idx ON public.ordenes_pago USING btree (empresa_id, proveedor_id);


--
-- Name: parametros_generales_clave_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX parametros_generales_clave_idx ON public.parametros_generales USING btree (clave);


--
-- Name: pedidos_compra_estado_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX pedidos_compra_estado_idx ON public.pedidos_compra USING btree (empresa_id, sucursal_id, estado);


--
-- Name: personas_razon_social_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX personas_razon_social_idx ON public.personas USING btree (empresa_id, razon_social);


--
-- Name: plan_cuentas_padre_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX plan_cuentas_padre_idx ON public.plan_cuentas USING btree (padre_id);


--
-- Name: presupuestos_cliente_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX presupuestos_cliente_idx ON public.presupuestos USING btree (empresa_id, cliente_id, estado);


--
-- Name: recepcion_detalles_origen_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX recepcion_detalles_origen_idx ON public.recepcion_detalles USING btree (detalle_origen_id);


--
-- Name: recepciones_factura_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX recepciones_factura_idx ON public.recepciones USING btree (factura_compra_id);


--
-- Name: sesiones_caja_abierta_uq; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX sesiones_caja_abierta_uq ON public.sesiones_caja USING btree (caja_id) WHERE (estado = 'abierta'::public.estado_sesion_caja);


--
-- Name: sesiones_caja_usuario_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sesiones_caja_usuario_idx ON public.sesiones_caja USING btree (usuario_id, estado);


--
-- Name: sifen_eventos_cdc_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sifen_eventos_cdc_idx ON public.sifen_eventos USING btree (cdc);


--
-- Name: sifen_eventos_factura_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sifen_eventos_factura_idx ON public.sifen_eventos USING btree (factura_venta_id, creado_en);


--
-- Name: stock_articulo_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX stock_articulo_idx ON public.stock USING btree (articulo_id);


--
-- Name: transferencias_stock_destino_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transferencias_stock_destino_idx ON public.transferencias_stock USING btree (sucursal_destino_id, estado);


--
-- Name: ajustes_stock trg_ajustes_stock_no_borrar; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_ajustes_stock_no_borrar BEFORE DELETE ON public.ajustes_stock FOR EACH ROW EXECUTE FUNCTION public.fn_prohibir_borrado_confirmado();


--
-- Name: asientos_contables trg_asientos_contables_no_borrar; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_asientos_contables_no_borrar BEFORE DELETE ON public.asientos_contables FOR EACH ROW EXECUTE FUNCTION public.fn_prohibir_borrado_confirmado();


--
-- Name: asientos_contables trg_asientos_partida_doble; Type: TRIGGER; Schema: public; Owner: -
--

CREATE CONSTRAINT TRIGGER trg_asientos_partida_doble AFTER INSERT OR UPDATE ON public.asientos_contables DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION public.fn_validar_partida_doble();


--
-- Name: cobros trg_cobros_no_borrar; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_cobros_no_borrar BEFORE DELETE ON public.cobros FOR EACH ROW EXECUTE FUNCTION public.fn_prohibir_borrado_confirmado();


--
-- Name: detalles_asiento_contable trg_detalles_asiento_partida_doble; Type: TRIGGER; Schema: public; Owner: -
--

CREATE CONSTRAINT TRIGGER trg_detalles_asiento_partida_doble AFTER INSERT OR DELETE OR UPDATE ON public.detalles_asiento_contable DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION public.fn_validar_partida_doble();


--
-- Name: facturas_compra trg_facturas_compra_no_borrar; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_facturas_compra_no_borrar BEFORE DELETE ON public.facturas_compra FOR EACH ROW EXECUTE FUNCTION public.fn_prohibir_borrado_confirmado();


--
-- Name: facturas_venta trg_facturas_venta_no_borrar; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_facturas_venta_no_borrar BEFORE DELETE ON public.facturas_venta FOR EACH ROW EXECUTE FUNCTION public.fn_prohibir_borrado_confirmado();


--
-- Name: historico_costos trg_historico_costos_append_only; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_historico_costos_append_only BEFORE DELETE OR UPDATE ON public.historico_costos FOR EACH ROW EXECUTE FUNCTION public.fn_append_only();


--
-- Name: kardex trg_kardex_append_only; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_kardex_append_only BEFORE DELETE OR UPDATE ON public.kardex FOR EACH ROW EXECUTE FUNCTION public.fn_append_only();


--
-- Name: ordenes_compra trg_ordenes_compra_no_borrar; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_ordenes_compra_no_borrar BEFORE DELETE ON public.ordenes_compra FOR EACH ROW EXECUTE FUNCTION public.fn_prohibir_borrado_confirmado();


--
-- Name: ordenes_pago trg_ordenes_pago_no_borrar; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_ordenes_pago_no_borrar BEFORE DELETE ON public.ordenes_pago FOR EACH ROW EXECUTE FUNCTION public.fn_prohibir_borrado_confirmado();


--
-- Name: pedidos_compra trg_pedidos_compra_no_borrar; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_pedidos_compra_no_borrar BEFORE DELETE ON public.pedidos_compra FOR EACH ROW EXECUTE FUNCTION public.fn_prohibir_borrado_confirmado();


--
-- Name: presupuestos trg_presupuestos_no_borrar; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_presupuestos_no_borrar BEFORE DELETE ON public.presupuestos FOR EACH ROW EXECUTE FUNCTION public.fn_prohibir_borrado_confirmado();


--
-- Name: recepciones trg_recepciones_no_borrar; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_recepciones_no_borrar BEFORE DELETE ON public.recepciones FOR EACH ROW EXECUTE FUNCTION public.fn_prohibir_borrado_confirmado();


--
-- Name: sifen_eventos trg_sifen_eventos_append_only; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_sifen_eventos_append_only BEFORE DELETE OR UPDATE ON public.sifen_eventos FOR EACH ROW EXECUTE FUNCTION public.fn_append_only();


--
-- Name: transferencias_stock trg_transferencias_stock_no_borrar; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_transferencias_stock_no_borrar BEFORE DELETE ON public.transferencias_stock FOR EACH ROW EXECUTE FUNCTION public.fn_prohibir_borrado_confirmado();


--
-- Name: ajuste_stock_detalles ajuste_stock_detalles_ajuste_stock_id_ajustes_stock_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ajuste_stock_detalles
    ADD CONSTRAINT ajuste_stock_detalles_ajuste_stock_id_ajustes_stock_id_fk FOREIGN KEY (ajuste_stock_id) REFERENCES public.ajustes_stock(id) ON DELETE CASCADE;


--
-- Name: ajuste_stock_detalles ajuste_stock_detalles_articulo_id_articulos_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ajuste_stock_detalles
    ADD CONSTRAINT ajuste_stock_detalles_articulo_id_articulos_id_fk FOREIGN KEY (articulo_id) REFERENCES public.articulos(id);


--
-- Name: ajuste_stock_detalles ajuste_stock_detalles_empresa_id_empresas_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ajuste_stock_detalles
    ADD CONSTRAINT ajuste_stock_detalles_empresa_id_empresas_id_fk FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);


--
-- Name: ajuste_stock_detalles ajuste_stock_detalles_sucursal_id_sucursales_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ajuste_stock_detalles
    ADD CONSTRAINT ajuste_stock_detalles_sucursal_id_sucursales_id_fk FOREIGN KEY (sucursal_id) REFERENCES public.sucursales(id);


--
-- Name: ajustes_stock ajustes_stock_anulado_por_usuarios_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ajustes_stock
    ADD CONSTRAINT ajustes_stock_anulado_por_usuarios_id_fk FOREIGN KEY (anulado_por) REFERENCES public.usuarios(id);


--
-- Name: ajustes_stock ajustes_stock_confirmado_por_usuarios_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ajustes_stock
    ADD CONSTRAINT ajustes_stock_confirmado_por_usuarios_id_fk FOREIGN KEY (confirmado_por) REFERENCES public.usuarios(id);


--
-- Name: ajustes_stock ajustes_stock_creado_por_usuarios_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ajustes_stock
    ADD CONSTRAINT ajustes_stock_creado_por_usuarios_id_fk FOREIGN KEY (creado_por) REFERENCES public.usuarios(id);


--
-- Name: ajustes_stock ajustes_stock_deposito_id_depositos_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ajustes_stock
    ADD CONSTRAINT ajustes_stock_deposito_id_depositos_id_fk FOREIGN KEY (deposito_id) REFERENCES public.depositos(id);


--
-- Name: ajustes_stock ajustes_stock_empresa_id_empresas_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ajustes_stock
    ADD CONSTRAINT ajustes_stock_empresa_id_empresas_id_fk FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);


--
-- Name: ajustes_stock ajustes_stock_sucursal_id_sucursales_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ajustes_stock
    ADD CONSTRAINT ajustes_stock_sucursal_id_sucursales_id_fk FOREIGN KEY (sucursal_id) REFERENCES public.sucursales(id);


--
-- Name: arqueos_caja arqueos_caja_empresa_id_empresas_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.arqueos_caja
    ADD CONSTRAINT arqueos_caja_empresa_id_empresas_id_fk FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);


--
-- Name: arqueos_caja arqueos_caja_sesion_caja_id_sesiones_caja_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.arqueos_caja
    ADD CONSTRAINT arqueos_caja_sesion_caja_id_sesiones_caja_id_fk FOREIGN KEY (sesion_caja_id) REFERENCES public.sesiones_caja(id) ON DELETE CASCADE;


--
-- Name: arqueos_caja arqueos_caja_sucursal_id_sucursales_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.arqueos_caja
    ADD CONSTRAINT arqueos_caja_sucursal_id_sucursales_id_fk FOREIGN KEY (sucursal_id) REFERENCES public.sucursales(id);


--
-- Name: articulo_unidades articulo_unidades_articulo_id_articulos_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.articulo_unidades
    ADD CONSTRAINT articulo_unidades_articulo_id_articulos_id_fk FOREIGN KEY (articulo_id) REFERENCES public.articulos(id) ON DELETE CASCADE;


--
-- Name: articulo_unidades articulo_unidades_empresa_id_empresas_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.articulo_unidades
    ADD CONSTRAINT articulo_unidades_empresa_id_empresas_id_fk FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);


--
-- Name: articulo_unidades articulo_unidades_unidad_medida_id_unidades_medida_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.articulo_unidades
    ADD CONSTRAINT articulo_unidades_unidad_medida_id_unidades_medida_id_fk FOREIGN KEY (unidad_medida_id) REFERENCES public.unidades_medida(id);


--
-- Name: articulos articulos_categoria_id_categorias_articulo_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.articulos
    ADD CONSTRAINT articulos_categoria_id_categorias_articulo_id_fk FOREIGN KEY (categoria_id) REFERENCES public.categorias_articulo(id);


--
-- Name: articulos articulos_empresa_id_empresas_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.articulos
    ADD CONSTRAINT articulos_empresa_id_empresas_id_fk FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);


--
-- Name: articulos articulos_marca_id_marcas_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.articulos
    ADD CONSTRAINT articulos_marca_id_marcas_id_fk FOREIGN KEY (marca_id) REFERENCES public.marcas(id);


--
-- Name: articulos articulos_modelo_id_modelos_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.articulos
    ADD CONSTRAINT articulos_modelo_id_modelos_id_fk FOREIGN KEY (modelo_id) REFERENCES public.modelos(id);


--
-- Name: articulos articulos_unidad_medida_id_unidades_medida_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.articulos
    ADD CONSTRAINT articulos_unidad_medida_id_unidades_medida_id_fk FOREIGN KEY (unidad_medida_id) REFERENCES public.unidades_medida(id);


--
-- Name: asientos_contables asientos_contables_anulado_por_usuarios_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asientos_contables
    ADD CONSTRAINT asientos_contables_anulado_por_usuarios_id_fk FOREIGN KEY (anulado_por) REFERENCES public.usuarios(id);


--
-- Name: asientos_contables asientos_contables_asiento_revertido_id_asientos_contables_id_f; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asientos_contables
    ADD CONSTRAINT asientos_contables_asiento_revertido_id_asientos_contables_id_f FOREIGN KEY (asiento_revertido_id) REFERENCES public.asientos_contables(id);


--
-- Name: asientos_contables asientos_contables_confirmado_por_usuarios_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asientos_contables
    ADD CONSTRAINT asientos_contables_confirmado_por_usuarios_id_fk FOREIGN KEY (confirmado_por) REFERENCES public.usuarios(id);


--
-- Name: asientos_contables asientos_contables_creado_por_usuarios_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asientos_contables
    ADD CONSTRAINT asientos_contables_creado_por_usuarios_id_fk FOREIGN KEY (creado_por) REFERENCES public.usuarios(id);


--
-- Name: asientos_contables asientos_contables_empresa_id_empresas_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asientos_contables
    ADD CONSTRAINT asientos_contables_empresa_id_empresas_id_fk FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);


--
-- Name: asientos_contables asientos_contables_sucursal_id_sucursales_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asientos_contables
    ADD CONSTRAINT asientos_contables_sucursal_id_sucursales_id_fk FOREIGN KEY (sucursal_id) REFERENCES public.sucursales(id);


--
-- Name: cajas cajas_deposito_id_depositos_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cajas
    ADD CONSTRAINT cajas_deposito_id_depositos_id_fk FOREIGN KEY (deposito_id) REFERENCES public.depositos(id);


--
-- Name: cajas cajas_empresa_id_empresas_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cajas
    ADD CONSTRAINT cajas_empresa_id_empresas_id_fk FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);


--
-- Name: cajas cajas_punto_expedicion_id_puntos_expedicion_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cajas
    ADD CONSTRAINT cajas_punto_expedicion_id_puntos_expedicion_id_fk FOREIGN KEY (punto_expedicion_id) REFERENCES public.puntos_expedicion(id);


--
-- Name: cajas cajas_sucursal_id_sucursales_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cajas
    ADD CONSTRAINT cajas_sucursal_id_sucursales_id_fk FOREIGN KEY (sucursal_id) REFERENCES public.sucursales(id);


--
-- Name: categorias_articulo categorias_articulo_empresa_id_empresas_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categorias_articulo
    ADD CONSTRAINT categorias_articulo_empresa_id_empresas_id_fk FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);


--
-- Name: categorias_articulo categorias_articulo_padre_id_categorias_articulo_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categorias_articulo
    ADD CONSTRAINT categorias_articulo_padre_id_categorias_articulo_id_fk FOREIGN KEY (padre_id) REFERENCES public.categorias_articulo(id);


--
-- Name: ciudades ciudades_departamento_id_departamentos_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ciudades
    ADD CONSTRAINT ciudades_departamento_id_departamentos_id_fk FOREIGN KEY (departamento_id) REFERENCES public.departamentos(id);


--
-- Name: clientes clientes_condicion_pago_id_condiciones_pago_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_condicion_pago_id_condiciones_pago_id_fk FOREIGN KEY (condicion_pago_id) REFERENCES public.condiciones_pago(id);


--
-- Name: clientes clientes_empresa_id_empresas_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_empresa_id_empresas_id_fk FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);


--
-- Name: clientes clientes_persona_id_personas_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_persona_id_personas_id_fk FOREIGN KEY (persona_id) REFERENCES public.personas(id);


--
-- Name: cobro_detalles cobro_detalles_cobro_id_cobros_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cobro_detalles
    ADD CONSTRAINT cobro_detalles_cobro_id_cobros_id_fk FOREIGN KEY (cobro_id) REFERENCES public.cobros(id) ON DELETE CASCADE;


--
-- Name: cobro_detalles cobro_detalles_cuenta_cobrar_id_cuentas_cobrar_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cobro_detalles
    ADD CONSTRAINT cobro_detalles_cuenta_cobrar_id_cuentas_cobrar_id_fk FOREIGN KEY (cuenta_cobrar_id) REFERENCES public.cuentas_cobrar(id);


--
-- Name: cobro_detalles cobro_detalles_empresa_id_empresas_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cobro_detalles
    ADD CONSTRAINT cobro_detalles_empresa_id_empresas_id_fk FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);


--
-- Name: cobro_detalles cobro_detalles_sucursal_id_sucursales_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cobro_detalles
    ADD CONSTRAINT cobro_detalles_sucursal_id_sucursales_id_fk FOREIGN KEY (sucursal_id) REFERENCES public.sucursales(id);


--
-- Name: cobro_medios cobro_medios_cobro_id_cobros_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cobro_medios
    ADD CONSTRAINT cobro_medios_cobro_id_cobros_id_fk FOREIGN KEY (cobro_id) REFERENCES public.cobros(id) ON DELETE CASCADE;


--
-- Name: cobro_medios cobro_medios_empresa_id_empresas_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cobro_medios
    ADD CONSTRAINT cobro_medios_empresa_id_empresas_id_fk FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);


--
-- Name: cobro_medios cobro_medios_sucursal_id_sucursales_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cobro_medios
    ADD CONSTRAINT cobro_medios_sucursal_id_sucursales_id_fk FOREIGN KEY (sucursal_id) REFERENCES public.sucursales(id);


--
-- Name: cobros cobros_anulado_por_usuarios_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cobros
    ADD CONSTRAINT cobros_anulado_por_usuarios_id_fk FOREIGN KEY (anulado_por) REFERENCES public.usuarios(id);


--
-- Name: cobros cobros_cliente_id_clientes_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cobros
    ADD CONSTRAINT cobros_cliente_id_clientes_id_fk FOREIGN KEY (cliente_id) REFERENCES public.clientes(id);


--
-- Name: cobros cobros_confirmado_por_usuarios_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cobros
    ADD CONSTRAINT cobros_confirmado_por_usuarios_id_fk FOREIGN KEY (confirmado_por) REFERENCES public.usuarios(id);


--
-- Name: cobros cobros_creado_por_usuarios_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cobros
    ADD CONSTRAINT cobros_creado_por_usuarios_id_fk FOREIGN KEY (creado_por) REFERENCES public.usuarios(id);


--
-- Name: cobros cobros_empresa_id_empresas_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cobros
    ADD CONSTRAINT cobros_empresa_id_empresas_id_fk FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);


--
-- Name: cobros cobros_sesion_caja_id_sesiones_caja_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cobros
    ADD CONSTRAINT cobros_sesion_caja_id_sesiones_caja_id_fk FOREIGN KEY (sesion_caja_id) REFERENCES public.sesiones_caja(id);


--
-- Name: cobros cobros_sucursal_id_sucursales_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cobros
    ADD CONSTRAINT cobros_sucursal_id_sucursales_id_fk FOREIGN KEY (sucursal_id) REFERENCES public.sucursales(id);


--
-- Name: condiciones_pago condiciones_pago_empresa_id_empresas_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.condiciones_pago
    ADD CONSTRAINT condiciones_pago_empresa_id_empresas_id_fk FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);


--
-- Name: configuracion_contable configuracion_contable_cuenta_id_plan_cuentas_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.configuracion_contable
    ADD CONSTRAINT configuracion_contable_cuenta_id_plan_cuentas_id_fk FOREIGN KEY (cuenta_id) REFERENCES public.plan_cuentas(id);


--
-- Name: configuracion_contable configuracion_contable_empresa_id_empresas_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.configuracion_contable
    ADD CONSTRAINT configuracion_contable_empresa_id_empresas_id_fk FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);


--
-- Name: configuracion_sifen configuracion_sifen_empresa_id_empresas_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.configuracion_sifen
    ADD CONSTRAINT configuracion_sifen_empresa_id_empresas_id_fk FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);


--
-- Name: configuracion_sifen configuracion_sifen_sucursal_id_sucursales_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.configuracion_sifen
    ADD CONSTRAINT configuracion_sifen_sucursal_id_sucursales_id_fk FOREIGN KEY (sucursal_id) REFERENCES public.sucursales(id);


--
-- Name: cuentas_cobrar cuentas_cobrar_cliente_id_clientes_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cuentas_cobrar
    ADD CONSTRAINT cuentas_cobrar_cliente_id_clientes_id_fk FOREIGN KEY (cliente_id) REFERENCES public.clientes(id);


--
-- Name: cuentas_cobrar cuentas_cobrar_cuota_venta_id_cuotas_venta_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cuentas_cobrar
    ADD CONSTRAINT cuentas_cobrar_cuota_venta_id_cuotas_venta_id_fk FOREIGN KEY (cuota_venta_id) REFERENCES public.cuotas_venta(id);


--
-- Name: cuentas_cobrar cuentas_cobrar_empresa_id_empresas_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cuentas_cobrar
    ADD CONSTRAINT cuentas_cobrar_empresa_id_empresas_id_fk FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);


--
-- Name: cuentas_cobrar cuentas_cobrar_factura_venta_id_facturas_venta_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cuentas_cobrar
    ADD CONSTRAINT cuentas_cobrar_factura_venta_id_facturas_venta_id_fk FOREIGN KEY (factura_venta_id) REFERENCES public.facturas_venta(id);


--
-- Name: cuentas_cobrar cuentas_cobrar_sucursal_id_sucursales_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cuentas_cobrar
    ADD CONSTRAINT cuentas_cobrar_sucursal_id_sucursales_id_fk FOREIGN KEY (sucursal_id) REFERENCES public.sucursales(id);


--
-- Name: cuentas_pagar cuentas_pagar_empresa_id_empresas_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cuentas_pagar
    ADD CONSTRAINT cuentas_pagar_empresa_id_empresas_id_fk FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);


--
-- Name: cuentas_pagar cuentas_pagar_factura_compra_id_facturas_compra_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cuentas_pagar
    ADD CONSTRAINT cuentas_pagar_factura_compra_id_facturas_compra_id_fk FOREIGN KEY (factura_compra_id) REFERENCES public.facturas_compra(id);


--
-- Name: cuentas_pagar cuentas_pagar_proveedor_id_proveedores_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cuentas_pagar
    ADD CONSTRAINT cuentas_pagar_proveedor_id_proveedores_id_fk FOREIGN KEY (proveedor_id) REFERENCES public.proveedores(id);


--
-- Name: cuentas_pagar cuentas_pagar_sucursal_id_sucursales_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cuentas_pagar
    ADD CONSTRAINT cuentas_pagar_sucursal_id_sucursales_id_fk FOREIGN KEY (sucursal_id) REFERENCES public.sucursales(id);


--
-- Name: cuotas_venta cuotas_venta_empresa_id_empresas_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cuotas_venta
    ADD CONSTRAINT cuotas_venta_empresa_id_empresas_id_fk FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);


--
-- Name: cuotas_venta cuotas_venta_factura_venta_id_facturas_venta_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cuotas_venta
    ADD CONSTRAINT cuotas_venta_factura_venta_id_facturas_venta_id_fk FOREIGN KEY (factura_venta_id) REFERENCES public.facturas_venta(id) ON DELETE CASCADE;


--
-- Name: cuotas_venta cuotas_venta_sucursal_id_sucursales_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cuotas_venta
    ADD CONSTRAINT cuotas_venta_sucursal_id_sucursales_id_fk FOREIGN KEY (sucursal_id) REFERENCES public.sucursales(id);


--
-- Name: departamentos departamentos_pais_id_paises_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departamentos
    ADD CONSTRAINT departamentos_pais_id_paises_id_fk FOREIGN KEY (pais_id) REFERENCES public.paises(id);


--
-- Name: depositos depositos_empresa_id_empresas_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.depositos
    ADD CONSTRAINT depositos_empresa_id_empresas_id_fk FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);


--
-- Name: depositos depositos_sucursal_id_sucursales_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.depositos
    ADD CONSTRAINT depositos_sucursal_id_sucursales_id_fk FOREIGN KEY (sucursal_id) REFERENCES public.sucursales(id);


--
-- Name: descuento_articulos descuento_articulos_articulo_id_articulos_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.descuento_articulos
    ADD CONSTRAINT descuento_articulos_articulo_id_articulos_id_fk FOREIGN KEY (articulo_id) REFERENCES public.articulos(id);


--
-- Name: descuento_articulos descuento_articulos_descuento_id_descuentos_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.descuento_articulos
    ADD CONSTRAINT descuento_articulos_descuento_id_descuentos_id_fk FOREIGN KEY (descuento_id) REFERENCES public.descuentos(id) ON DELETE CASCADE;


--
-- Name: descuento_articulos descuento_articulos_empresa_id_empresas_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.descuento_articulos
    ADD CONSTRAINT descuento_articulos_empresa_id_empresas_id_fk FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);


--
-- Name: descuento_sucursales descuento_sucursales_descuento_id_descuentos_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.descuento_sucursales
    ADD CONSTRAINT descuento_sucursales_descuento_id_descuentos_id_fk FOREIGN KEY (descuento_id) REFERENCES public.descuentos(id) ON DELETE CASCADE;


--
-- Name: descuento_sucursales descuento_sucursales_empresa_id_empresas_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.descuento_sucursales
    ADD CONSTRAINT descuento_sucursales_empresa_id_empresas_id_fk FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);


--
-- Name: descuento_sucursales descuento_sucursales_sucursal_id_sucursales_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.descuento_sucursales
    ADD CONSTRAINT descuento_sucursales_sucursal_id_sucursales_id_fk FOREIGN KEY (sucursal_id) REFERENCES public.sucursales(id);


--
-- Name: descuentos descuentos_anulado_por_usuarios_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.descuentos
    ADD CONSTRAINT descuentos_anulado_por_usuarios_id_fk FOREIGN KEY (anulado_por) REFERENCES public.usuarios(id);


--
-- Name: descuentos descuentos_confirmado_por_usuarios_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.descuentos
    ADD CONSTRAINT descuentos_confirmado_por_usuarios_id_fk FOREIGN KEY (confirmado_por) REFERENCES public.usuarios(id);


--
-- Name: descuentos descuentos_creado_por_usuarios_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.descuentos
    ADD CONSTRAINT descuentos_creado_por_usuarios_id_fk FOREIGN KEY (creado_por) REFERENCES public.usuarios(id);


--
-- Name: descuentos descuentos_empresa_id_empresas_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.descuentos
    ADD CONSTRAINT descuentos_empresa_id_empresas_id_fk FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);


--
-- Name: detalles_asiento_contable detalles_asiento_contable_asiento_id_asientos_contables_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detalles_asiento_contable
    ADD CONSTRAINT detalles_asiento_contable_asiento_id_asientos_contables_id_fk FOREIGN KEY (asiento_id) REFERENCES public.asientos_contables(id) ON DELETE CASCADE;


--
-- Name: detalles_asiento_contable detalles_asiento_contable_cuenta_id_plan_cuentas_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detalles_asiento_contable
    ADD CONSTRAINT detalles_asiento_contable_cuenta_id_plan_cuentas_id_fk FOREIGN KEY (cuenta_id) REFERENCES public.plan_cuentas(id);


--
-- Name: detalles_asiento_contable detalles_asiento_contable_empresa_id_empresas_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detalles_asiento_contable
    ADD CONSTRAINT detalles_asiento_contable_empresa_id_empresas_id_fk FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);


--
-- Name: detalles_asiento_contable detalles_asiento_contable_sucursal_id_sucursales_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detalles_asiento_contable
    ADD CONSTRAINT detalles_asiento_contable_sucursal_id_sucursales_id_fk FOREIGN KEY (sucursal_id) REFERENCES public.sucursales(id);


--
-- Name: empresas empresas_actividad_economica_id_actividades_economicas_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empresas
    ADD CONSTRAINT empresas_actividad_economica_id_actividades_economicas_id_fk FOREIGN KEY (actividad_economica_id) REFERENCES public.actividades_economicas(id);


--
-- Name: empresas empresas_ciudad_id_ciudades_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empresas
    ADD CONSTRAINT empresas_ciudad_id_ciudades_id_fk FOREIGN KEY (ciudad_id) REFERENCES public.ciudades(id);


--
-- Name: establecimientos establecimientos_empresa_id_empresas_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.establecimientos
    ADD CONSTRAINT establecimientos_empresa_id_empresas_id_fk FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);


--
-- Name: establecimientos establecimientos_sucursal_id_sucursales_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.establecimientos
    ADD CONSTRAINT establecimientos_sucursal_id_sucursales_id_fk FOREIGN KEY (sucursal_id) REFERENCES public.sucursales(id);


--
-- Name: factura_compra_detalles factura_compra_detalles_articulo_id_articulos_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.factura_compra_detalles
    ADD CONSTRAINT factura_compra_detalles_articulo_id_articulos_id_fk FOREIGN KEY (articulo_id) REFERENCES public.articulos(id);


--
-- Name: factura_compra_detalles factura_compra_detalles_descuento_id_descuentos_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.factura_compra_detalles
    ADD CONSTRAINT factura_compra_detalles_descuento_id_descuentos_id_fk FOREIGN KEY (descuento_id) REFERENCES public.descuentos(id);


--
-- Name: factura_compra_detalles factura_compra_detalles_detalle_origen_id_orden_compra_detalles; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.factura_compra_detalles
    ADD CONSTRAINT factura_compra_detalles_detalle_origen_id_orden_compra_detalles FOREIGN KEY (detalle_origen_id) REFERENCES public.orden_compra_detalles(id);


--
-- Name: factura_compra_detalles factura_compra_detalles_empresa_id_empresas_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.factura_compra_detalles
    ADD CONSTRAINT factura_compra_detalles_empresa_id_empresas_id_fk FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);


--
-- Name: factura_compra_detalles factura_compra_detalles_factura_compra_id_facturas_compra_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.factura_compra_detalles
    ADD CONSTRAINT factura_compra_detalles_factura_compra_id_facturas_compra_id_fk FOREIGN KEY (factura_compra_id) REFERENCES public.facturas_compra(id) ON DELETE CASCADE;


--
-- Name: factura_compra_detalles factura_compra_detalles_sucursal_id_sucursales_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.factura_compra_detalles
    ADD CONSTRAINT factura_compra_detalles_sucursal_id_sucursales_id_fk FOREIGN KEY (sucursal_id) REFERENCES public.sucursales(id);


--
-- Name: factura_compra_detalles factura_compra_detalles_unidad_medida_id_unidades_medida_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.factura_compra_detalles
    ADD CONSTRAINT factura_compra_detalles_unidad_medida_id_unidades_medida_id_fk FOREIGN KEY (unidad_medida_id) REFERENCES public.unidades_medida(id);


--
-- Name: factura_venta_detalles factura_venta_detalles_articulo_id_articulos_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.factura_venta_detalles
    ADD CONSTRAINT factura_venta_detalles_articulo_id_articulos_id_fk FOREIGN KEY (articulo_id) REFERENCES public.articulos(id);


--
-- Name: factura_venta_detalles factura_venta_detalles_descuento_id_descuentos_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.factura_venta_detalles
    ADD CONSTRAINT factura_venta_detalles_descuento_id_descuentos_id_fk FOREIGN KEY (descuento_id) REFERENCES public.descuentos(id);


--
-- Name: factura_venta_detalles factura_venta_detalles_detalle_origen_id_presupuesto_detalles_i; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.factura_venta_detalles
    ADD CONSTRAINT factura_venta_detalles_detalle_origen_id_presupuesto_detalles_i FOREIGN KEY (detalle_origen_id) REFERENCES public.presupuesto_detalles(id);


--
-- Name: factura_venta_detalles factura_venta_detalles_empresa_id_empresas_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.factura_venta_detalles
    ADD CONSTRAINT factura_venta_detalles_empresa_id_empresas_id_fk FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);


--
-- Name: factura_venta_detalles factura_venta_detalles_factura_venta_id_facturas_venta_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.factura_venta_detalles
    ADD CONSTRAINT factura_venta_detalles_factura_venta_id_facturas_venta_id_fk FOREIGN KEY (factura_venta_id) REFERENCES public.facturas_venta(id) ON DELETE CASCADE;


--
-- Name: factura_venta_detalles factura_venta_detalles_sucursal_id_sucursales_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.factura_venta_detalles
    ADD CONSTRAINT factura_venta_detalles_sucursal_id_sucursales_id_fk FOREIGN KEY (sucursal_id) REFERENCES public.sucursales(id);


--
-- Name: factura_venta_detalles factura_venta_detalles_unidad_medida_id_unidades_medida_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.factura_venta_detalles
    ADD CONSTRAINT factura_venta_detalles_unidad_medida_id_unidades_medida_id_fk FOREIGN KEY (unidad_medida_id) REFERENCES public.unidades_medida(id);


--
-- Name: facturas_compra facturas_compra_anulado_por_usuarios_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.facturas_compra
    ADD CONSTRAINT facturas_compra_anulado_por_usuarios_id_fk FOREIGN KEY (anulado_por) REFERENCES public.usuarios(id);


--
-- Name: facturas_compra facturas_compra_condicion_pago_id_condiciones_pago_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.facturas_compra
    ADD CONSTRAINT facturas_compra_condicion_pago_id_condiciones_pago_id_fk FOREIGN KEY (condicion_pago_id) REFERENCES public.condiciones_pago(id);


--
-- Name: facturas_compra facturas_compra_confirmado_por_usuarios_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.facturas_compra
    ADD CONSTRAINT facturas_compra_confirmado_por_usuarios_id_fk FOREIGN KEY (confirmado_por) REFERENCES public.usuarios(id);


--
-- Name: facturas_compra facturas_compra_creado_por_usuarios_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.facturas_compra
    ADD CONSTRAINT facturas_compra_creado_por_usuarios_id_fk FOREIGN KEY (creado_por) REFERENCES public.usuarios(id);


--
-- Name: facturas_compra facturas_compra_deposito_id_depositos_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.facturas_compra
    ADD CONSTRAINT facturas_compra_deposito_id_depositos_id_fk FOREIGN KEY (deposito_id) REFERENCES public.depositos(id);


--
-- Name: facturas_compra facturas_compra_empresa_id_empresas_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.facturas_compra
    ADD CONSTRAINT facturas_compra_empresa_id_empresas_id_fk FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);


--
-- Name: facturas_compra facturas_compra_orden_compra_id_ordenes_compra_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.facturas_compra
    ADD CONSTRAINT facturas_compra_orden_compra_id_ordenes_compra_id_fk FOREIGN KEY (orden_compra_id) REFERENCES public.ordenes_compra(id);


--
-- Name: facturas_compra facturas_compra_proveedor_id_proveedores_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.facturas_compra
    ADD CONSTRAINT facturas_compra_proveedor_id_proveedores_id_fk FOREIGN KEY (proveedor_id) REFERENCES public.proveedores(id);


--
-- Name: facturas_compra facturas_compra_sucursal_id_sucursales_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.facturas_compra
    ADD CONSTRAINT facturas_compra_sucursal_id_sucursales_id_fk FOREIGN KEY (sucursal_id) REFERENCES public.sucursales(id);


--
-- Name: facturas_venta facturas_venta_anulado_por_usuarios_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.facturas_venta
    ADD CONSTRAINT facturas_venta_anulado_por_usuarios_id_fk FOREIGN KEY (anulado_por) REFERENCES public.usuarios(id);


--
-- Name: facturas_venta facturas_venta_cliente_id_clientes_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.facturas_venta
    ADD CONSTRAINT facturas_venta_cliente_id_clientes_id_fk FOREIGN KEY (cliente_id) REFERENCES public.clientes(id);


--
-- Name: facturas_venta facturas_venta_confirmado_por_usuarios_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.facturas_venta
    ADD CONSTRAINT facturas_venta_confirmado_por_usuarios_id_fk FOREIGN KEY (confirmado_por) REFERENCES public.usuarios(id);


--
-- Name: facturas_venta facturas_venta_creado_por_usuarios_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.facturas_venta
    ADD CONSTRAINT facturas_venta_creado_por_usuarios_id_fk FOREIGN KEY (creado_por) REFERENCES public.usuarios(id);


--
-- Name: facturas_venta facturas_venta_deposito_id_depositos_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.facturas_venta
    ADD CONSTRAINT facturas_venta_deposito_id_depositos_id_fk FOREIGN KEY (deposito_id) REFERENCES public.depositos(id);


--
-- Name: facturas_venta facturas_venta_empresa_id_empresas_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.facturas_venta
    ADD CONSTRAINT facturas_venta_empresa_id_empresas_id_fk FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);


--
-- Name: facturas_venta facturas_venta_presupuesto_id_presupuestos_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.facturas_venta
    ADD CONSTRAINT facturas_venta_presupuesto_id_presupuestos_id_fk FOREIGN KEY (presupuesto_id) REFERENCES public.presupuestos(id);


--
-- Name: facturas_venta facturas_venta_punto_expedicion_id_puntos_expedicion_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.facturas_venta
    ADD CONSTRAINT facturas_venta_punto_expedicion_id_puntos_expedicion_id_fk FOREIGN KEY (punto_expedicion_id) REFERENCES public.puntos_expedicion(id);


--
-- Name: facturas_venta facturas_venta_receptor_tipo_documento_id_tipos_documento_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.facturas_venta
    ADD CONSTRAINT facturas_venta_receptor_tipo_documento_id_tipos_documento_id_fk FOREIGN KEY (receptor_tipo_documento_id) REFERENCES public.tipos_documento(id);


--
-- Name: facturas_venta facturas_venta_sesion_caja_id_sesiones_caja_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.facturas_venta
    ADD CONSTRAINT facturas_venta_sesion_caja_id_sesiones_caja_id_fk FOREIGN KEY (sesion_caja_id) REFERENCES public.sesiones_caja(id);


--
-- Name: facturas_venta facturas_venta_sucursal_id_sucursales_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.facturas_venta
    ADD CONSTRAINT facturas_venta_sucursal_id_sucursales_id_fk FOREIGN KEY (sucursal_id) REFERENCES public.sucursales(id);


--
-- Name: facturas_venta facturas_venta_timbrado_id_timbrados_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.facturas_venta
    ADD CONSTRAINT facturas_venta_timbrado_id_timbrados_id_fk FOREIGN KEY (timbrado_id) REFERENCES public.timbrados(id);


--
-- Name: facturas_venta facturas_venta_vendedor_id_usuarios_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.facturas_venta
    ADD CONSTRAINT facturas_venta_vendedor_id_usuarios_id_fk FOREIGN KEY (vendedor_id) REFERENCES public.usuarios(id);


--
-- Name: historico_costos historico_costos_articulo_id_articulos_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historico_costos
    ADD CONSTRAINT historico_costos_articulo_id_articulos_id_fk FOREIGN KEY (articulo_id) REFERENCES public.articulos(id);


--
-- Name: historico_costos historico_costos_creado_por_usuarios_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historico_costos
    ADD CONSTRAINT historico_costos_creado_por_usuarios_id_fk FOREIGN KEY (creado_por) REFERENCES public.usuarios(id);


--
-- Name: historico_costos historico_costos_deposito_id_depositos_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historico_costos
    ADD CONSTRAINT historico_costos_deposito_id_depositos_id_fk FOREIGN KEY (deposito_id) REFERENCES public.depositos(id);


--
-- Name: historico_costos historico_costos_detalle_factura_compra_id_factura_compra_detal; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historico_costos
    ADD CONSTRAINT historico_costos_detalle_factura_compra_id_factura_compra_detal FOREIGN KEY (detalle_factura_compra_id) REFERENCES public.factura_compra_detalles(id);


--
-- Name: historico_costos historico_costos_empresa_id_empresas_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historico_costos
    ADD CONSTRAINT historico_costos_empresa_id_empresas_id_fk FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);


--
-- Name: historico_costos historico_costos_proveedor_id_proveedores_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historico_costos
    ADD CONSTRAINT historico_costos_proveedor_id_proveedores_id_fk FOREIGN KEY (proveedor_id) REFERENCES public.proveedores(id);


--
-- Name: historico_costos historico_costos_recepcion_detalle_id_recepcion_detalles_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historico_costos
    ADD CONSTRAINT historico_costos_recepcion_detalle_id_recepcion_detalles_id_fk FOREIGN KEY (recepcion_detalle_id) REFERENCES public.recepcion_detalles(id);


--
-- Name: historico_costos historico_costos_sucursal_id_sucursales_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historico_costos
    ADD CONSTRAINT historico_costos_sucursal_id_sucursales_id_fk FOREIGN KEY (sucursal_id) REFERENCES public.sucursales(id);


--
-- Name: kardex kardex_articulo_id_articulos_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kardex
    ADD CONSTRAINT kardex_articulo_id_articulos_id_fk FOREIGN KEY (articulo_id) REFERENCES public.articulos(id);


--
-- Name: kardex kardex_deposito_id_depositos_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kardex
    ADD CONSTRAINT kardex_deposito_id_depositos_id_fk FOREIGN KEY (deposito_id) REFERENCES public.depositos(id);


--
-- Name: kardex kardex_empresa_id_empresas_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kardex
    ADD CONSTRAINT kardex_empresa_id_empresas_id_fk FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);


--
-- Name: kardex kardex_sucursal_id_sucursales_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kardex
    ADD CONSTRAINT kardex_sucursal_id_sucursales_id_fk FOREIGN KEY (sucursal_id) REFERENCES public.sucursales(id);


--
-- Name: kardex kardex_usuario_id_usuarios_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kardex
    ADD CONSTRAINT kardex_usuario_id_usuarios_id_fk FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);


--
-- Name: marcas marcas_empresa_id_empresas_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marcas
    ADD CONSTRAINT marcas_empresa_id_empresas_id_fk FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);


--
-- Name: modelos modelos_empresa_id_empresas_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.modelos
    ADD CONSTRAINT modelos_empresa_id_empresas_id_fk FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);


--
-- Name: modelos modelos_marca_id_marcas_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.modelos
    ADD CONSTRAINT modelos_marca_id_marcas_id_fk FOREIGN KEY (marca_id) REFERENCES public.marcas(id);


--
-- Name: numeraciones_documento numeraciones_documento_empresa_id_empresas_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.numeraciones_documento
    ADD CONSTRAINT numeraciones_documento_empresa_id_empresas_id_fk FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);


--
-- Name: numeraciones_documento numeraciones_documento_punto_expedicion_id_puntos_expedicion_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.numeraciones_documento
    ADD CONSTRAINT numeraciones_documento_punto_expedicion_id_puntos_expedicion_id FOREIGN KEY (punto_expedicion_id) REFERENCES public.puntos_expedicion(id);


--
-- Name: numeraciones_documento numeraciones_documento_sucursal_id_sucursales_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.numeraciones_documento
    ADD CONSTRAINT numeraciones_documento_sucursal_id_sucursales_id_fk FOREIGN KEY (sucursal_id) REFERENCES public.sucursales(id);


--
-- Name: numeraciones_documento numeraciones_documento_timbrado_id_timbrados_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.numeraciones_documento
    ADD CONSTRAINT numeraciones_documento_timbrado_id_timbrados_id_fk FOREIGN KEY (timbrado_id) REFERENCES public.timbrados(id);


--
-- Name: orden_compra_detalles orden_compra_detalles_articulo_id_articulos_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orden_compra_detalles
    ADD CONSTRAINT orden_compra_detalles_articulo_id_articulos_id_fk FOREIGN KEY (articulo_id) REFERENCES public.articulos(id);


--
-- Name: orden_compra_detalles orden_compra_detalles_descuento_id_descuentos_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orden_compra_detalles
    ADD CONSTRAINT orden_compra_detalles_descuento_id_descuentos_id_fk FOREIGN KEY (descuento_id) REFERENCES public.descuentos(id);


--
-- Name: orden_compra_detalles orden_compra_detalles_detalle_origen_id_pedido_compra_detalles_; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orden_compra_detalles
    ADD CONSTRAINT orden_compra_detalles_detalle_origen_id_pedido_compra_detalles_ FOREIGN KEY (detalle_origen_id) REFERENCES public.pedido_compra_detalles(id);


--
-- Name: orden_compra_detalles orden_compra_detalles_empresa_id_empresas_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orden_compra_detalles
    ADD CONSTRAINT orden_compra_detalles_empresa_id_empresas_id_fk FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);


--
-- Name: orden_compra_detalles orden_compra_detalles_orden_compra_id_ordenes_compra_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orden_compra_detalles
    ADD CONSTRAINT orden_compra_detalles_orden_compra_id_ordenes_compra_id_fk FOREIGN KEY (orden_compra_id) REFERENCES public.ordenes_compra(id) ON DELETE CASCADE;


--
-- Name: orden_compra_detalles orden_compra_detalles_sucursal_id_sucursales_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orden_compra_detalles
    ADD CONSTRAINT orden_compra_detalles_sucursal_id_sucursales_id_fk FOREIGN KEY (sucursal_id) REFERENCES public.sucursales(id);


--
-- Name: orden_compra_detalles orden_compra_detalles_unidad_medida_id_unidades_medida_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orden_compra_detalles
    ADD CONSTRAINT orden_compra_detalles_unidad_medida_id_unidades_medida_id_fk FOREIGN KEY (unidad_medida_id) REFERENCES public.unidades_medida(id);


--
-- Name: orden_compra_pedidos orden_compra_pedidos_empresa_id_empresas_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orden_compra_pedidos
    ADD CONSTRAINT orden_compra_pedidos_empresa_id_empresas_id_fk FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);


--
-- Name: orden_compra_pedidos orden_compra_pedidos_orden_compra_id_ordenes_compra_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orden_compra_pedidos
    ADD CONSTRAINT orden_compra_pedidos_orden_compra_id_ordenes_compra_id_fk FOREIGN KEY (orden_compra_id) REFERENCES public.ordenes_compra(id) ON DELETE CASCADE;


--
-- Name: orden_compra_pedidos orden_compra_pedidos_pedido_compra_id_pedidos_compra_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orden_compra_pedidos
    ADD CONSTRAINT orden_compra_pedidos_pedido_compra_id_pedidos_compra_id_fk FOREIGN KEY (pedido_compra_id) REFERENCES public.pedidos_compra(id);


--
-- Name: orden_compra_pedidos orden_compra_pedidos_sucursal_id_sucursales_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orden_compra_pedidos
    ADD CONSTRAINT orden_compra_pedidos_sucursal_id_sucursales_id_fk FOREIGN KEY (sucursal_id) REFERENCES public.sucursales(id);


--
-- Name: orden_pago_detalles orden_pago_detalles_cuenta_pagar_id_cuentas_pagar_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orden_pago_detalles
    ADD CONSTRAINT orden_pago_detalles_cuenta_pagar_id_cuentas_pagar_id_fk FOREIGN KEY (cuenta_pagar_id) REFERENCES public.cuentas_pagar(id);


--
-- Name: orden_pago_detalles orden_pago_detalles_empresa_id_empresas_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orden_pago_detalles
    ADD CONSTRAINT orden_pago_detalles_empresa_id_empresas_id_fk FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);


--
-- Name: orden_pago_detalles orden_pago_detalles_orden_pago_id_ordenes_pago_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orden_pago_detalles
    ADD CONSTRAINT orden_pago_detalles_orden_pago_id_ordenes_pago_id_fk FOREIGN KEY (orden_pago_id) REFERENCES public.ordenes_pago(id) ON DELETE CASCADE;


--
-- Name: orden_pago_detalles orden_pago_detalles_sucursal_id_sucursales_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orden_pago_detalles
    ADD CONSTRAINT orden_pago_detalles_sucursal_id_sucursales_id_fk FOREIGN KEY (sucursal_id) REFERENCES public.sucursales(id);


--
-- Name: ordenes_compra ordenes_compra_anulado_por_usuarios_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ordenes_compra
    ADD CONSTRAINT ordenes_compra_anulado_por_usuarios_id_fk FOREIGN KEY (anulado_por) REFERENCES public.usuarios(id);


--
-- Name: ordenes_compra ordenes_compra_condicion_pago_id_condiciones_pago_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ordenes_compra
    ADD CONSTRAINT ordenes_compra_condicion_pago_id_condiciones_pago_id_fk FOREIGN KEY (condicion_pago_id) REFERENCES public.condiciones_pago(id);


--
-- Name: ordenes_compra ordenes_compra_confirmado_por_usuarios_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ordenes_compra
    ADD CONSTRAINT ordenes_compra_confirmado_por_usuarios_id_fk FOREIGN KEY (confirmado_por) REFERENCES public.usuarios(id);


--
-- Name: ordenes_compra ordenes_compra_creado_por_usuarios_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ordenes_compra
    ADD CONSTRAINT ordenes_compra_creado_por_usuarios_id_fk FOREIGN KEY (creado_por) REFERENCES public.usuarios(id);


--
-- Name: ordenes_compra ordenes_compra_deposito_id_depositos_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ordenes_compra
    ADD CONSTRAINT ordenes_compra_deposito_id_depositos_id_fk FOREIGN KEY (deposito_id) REFERENCES public.depositos(id);


--
-- Name: ordenes_compra ordenes_compra_empresa_id_empresas_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ordenes_compra
    ADD CONSTRAINT ordenes_compra_empresa_id_empresas_id_fk FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);


--
-- Name: ordenes_compra ordenes_compra_proveedor_id_proveedores_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ordenes_compra
    ADD CONSTRAINT ordenes_compra_proveedor_id_proveedores_id_fk FOREIGN KEY (proveedor_id) REFERENCES public.proveedores(id);


--
-- Name: ordenes_compra ordenes_compra_sucursal_id_sucursales_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ordenes_compra
    ADD CONSTRAINT ordenes_compra_sucursal_id_sucursales_id_fk FOREIGN KEY (sucursal_id) REFERENCES public.sucursales(id);


--
-- Name: ordenes_pago ordenes_pago_anulado_por_usuarios_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ordenes_pago
    ADD CONSTRAINT ordenes_pago_anulado_por_usuarios_id_fk FOREIGN KEY (anulado_por) REFERENCES public.usuarios(id);


--
-- Name: ordenes_pago ordenes_pago_confirmado_por_usuarios_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ordenes_pago
    ADD CONSTRAINT ordenes_pago_confirmado_por_usuarios_id_fk FOREIGN KEY (confirmado_por) REFERENCES public.usuarios(id);


--
-- Name: ordenes_pago ordenes_pago_creado_por_usuarios_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ordenes_pago
    ADD CONSTRAINT ordenes_pago_creado_por_usuarios_id_fk FOREIGN KEY (creado_por) REFERENCES public.usuarios(id);


--
-- Name: ordenes_pago ordenes_pago_empresa_id_empresas_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ordenes_pago
    ADD CONSTRAINT ordenes_pago_empresa_id_empresas_id_fk FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);


--
-- Name: ordenes_pago ordenes_pago_proveedor_id_proveedores_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ordenes_pago
    ADD CONSTRAINT ordenes_pago_proveedor_id_proveedores_id_fk FOREIGN KEY (proveedor_id) REFERENCES public.proveedores(id);


--
-- Name: ordenes_pago ordenes_pago_sucursal_id_sucursales_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ordenes_pago
    ADD CONSTRAINT ordenes_pago_sucursal_id_sucursales_id_fk FOREIGN KEY (sucursal_id) REFERENCES public.sucursales(id);


--
-- Name: parametros_generales parametros_generales_empresa_id_empresas_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parametros_generales
    ADD CONSTRAINT parametros_generales_empresa_id_empresas_id_fk FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);


--
-- Name: parametros_generales parametros_generales_sucursal_id_sucursales_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parametros_generales
    ADD CONSTRAINT parametros_generales_sucursal_id_sucursales_id_fk FOREIGN KEY (sucursal_id) REFERENCES public.sucursales(id);


--
-- Name: pedido_compra_detalles pedido_compra_detalles_articulo_id_articulos_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pedido_compra_detalles
    ADD CONSTRAINT pedido_compra_detalles_articulo_id_articulos_id_fk FOREIGN KEY (articulo_id) REFERENCES public.articulos(id);


--
-- Name: pedido_compra_detalles pedido_compra_detalles_empresa_id_empresas_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pedido_compra_detalles
    ADD CONSTRAINT pedido_compra_detalles_empresa_id_empresas_id_fk FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);


--
-- Name: pedido_compra_detalles pedido_compra_detalles_pedido_compra_id_pedidos_compra_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pedido_compra_detalles
    ADD CONSTRAINT pedido_compra_detalles_pedido_compra_id_pedidos_compra_id_fk FOREIGN KEY (pedido_compra_id) REFERENCES public.pedidos_compra(id) ON DELETE CASCADE;


--
-- Name: pedido_compra_detalles pedido_compra_detalles_sucursal_id_sucursales_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pedido_compra_detalles
    ADD CONSTRAINT pedido_compra_detalles_sucursal_id_sucursales_id_fk FOREIGN KEY (sucursal_id) REFERENCES public.sucursales(id);


--
-- Name: pedido_compra_detalles pedido_compra_detalles_unidad_medida_id_unidades_medida_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pedido_compra_detalles
    ADD CONSTRAINT pedido_compra_detalles_unidad_medida_id_unidades_medida_id_fk FOREIGN KEY (unidad_medida_id) REFERENCES public.unidades_medida(id);


--
-- Name: pedidos_compra pedidos_compra_anulado_por_usuarios_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pedidos_compra
    ADD CONSTRAINT pedidos_compra_anulado_por_usuarios_id_fk FOREIGN KEY (anulado_por) REFERENCES public.usuarios(id);


--
-- Name: pedidos_compra pedidos_compra_confirmado_por_usuarios_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pedidos_compra
    ADD CONSTRAINT pedidos_compra_confirmado_por_usuarios_id_fk FOREIGN KEY (confirmado_por) REFERENCES public.usuarios(id);


--
-- Name: pedidos_compra pedidos_compra_creado_por_usuarios_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pedidos_compra
    ADD CONSTRAINT pedidos_compra_creado_por_usuarios_id_fk FOREIGN KEY (creado_por) REFERENCES public.usuarios(id);


--
-- Name: pedidos_compra pedidos_compra_deposito_id_depositos_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pedidos_compra
    ADD CONSTRAINT pedidos_compra_deposito_id_depositos_id_fk FOREIGN KEY (deposito_id) REFERENCES public.depositos(id);


--
-- Name: pedidos_compra pedidos_compra_empresa_id_empresas_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pedidos_compra
    ADD CONSTRAINT pedidos_compra_empresa_id_empresas_id_fk FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);


--
-- Name: pedidos_compra pedidos_compra_proveedor_id_proveedores_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pedidos_compra
    ADD CONSTRAINT pedidos_compra_proveedor_id_proveedores_id_fk FOREIGN KEY (proveedor_id) REFERENCES public.proveedores(id);


--
-- Name: pedidos_compra pedidos_compra_sucursal_id_sucursales_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pedidos_compra
    ADD CONSTRAINT pedidos_compra_sucursal_id_sucursales_id_fk FOREIGN KEY (sucursal_id) REFERENCES public.sucursales(id);


--
-- Name: personas personas_actividad_economica_id_actividades_economicas_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personas
    ADD CONSTRAINT personas_actividad_economica_id_actividades_economicas_id_fk FOREIGN KEY (actividad_economica_id) REFERENCES public.actividades_economicas(id);


--
-- Name: personas personas_ciudad_id_ciudades_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personas
    ADD CONSTRAINT personas_ciudad_id_ciudades_id_fk FOREIGN KEY (ciudad_id) REFERENCES public.ciudades(id);


--
-- Name: personas personas_empresa_id_empresas_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personas
    ADD CONSTRAINT personas_empresa_id_empresas_id_fk FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);


--
-- Name: personas personas_pais_id_paises_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personas
    ADD CONSTRAINT personas_pais_id_paises_id_fk FOREIGN KEY (pais_id) REFERENCES public.paises(id);


--
-- Name: personas personas_tipo_documento_id_tipos_documento_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personas
    ADD CONSTRAINT personas_tipo_documento_id_tipos_documento_id_fk FOREIGN KEY (tipo_documento_id) REFERENCES public.tipos_documento(id);


--
-- Name: personas personas_tipo_persona_id_tipos_persona_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personas
    ADD CONSTRAINT personas_tipo_persona_id_tipos_persona_id_fk FOREIGN KEY (tipo_persona_id) REFERENCES public.tipos_persona(id);


--
-- Name: plan_cuentas plan_cuentas_empresa_id_empresas_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plan_cuentas
    ADD CONSTRAINT plan_cuentas_empresa_id_empresas_id_fk FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);


--
-- Name: plan_cuentas plan_cuentas_padre_id_plan_cuentas_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plan_cuentas
    ADD CONSTRAINT plan_cuentas_padre_id_plan_cuentas_id_fk FOREIGN KEY (padre_id) REFERENCES public.plan_cuentas(id);


--
-- Name: presupuesto_detalles presupuesto_detalles_articulo_id_articulos_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.presupuesto_detalles
    ADD CONSTRAINT presupuesto_detalles_articulo_id_articulos_id_fk FOREIGN KEY (articulo_id) REFERENCES public.articulos(id);


--
-- Name: presupuesto_detalles presupuesto_detalles_descuento_id_descuentos_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.presupuesto_detalles
    ADD CONSTRAINT presupuesto_detalles_descuento_id_descuentos_id_fk FOREIGN KEY (descuento_id) REFERENCES public.descuentos(id);


--
-- Name: presupuesto_detalles presupuesto_detalles_empresa_id_empresas_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.presupuesto_detalles
    ADD CONSTRAINT presupuesto_detalles_empresa_id_empresas_id_fk FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);


--
-- Name: presupuesto_detalles presupuesto_detalles_presupuesto_id_presupuestos_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.presupuesto_detalles
    ADD CONSTRAINT presupuesto_detalles_presupuesto_id_presupuestos_id_fk FOREIGN KEY (presupuesto_id) REFERENCES public.presupuestos(id) ON DELETE CASCADE;


--
-- Name: presupuesto_detalles presupuesto_detalles_sucursal_id_sucursales_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.presupuesto_detalles
    ADD CONSTRAINT presupuesto_detalles_sucursal_id_sucursales_id_fk FOREIGN KEY (sucursal_id) REFERENCES public.sucursales(id);


--
-- Name: presupuesto_detalles presupuesto_detalles_unidad_medida_id_unidades_medida_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.presupuesto_detalles
    ADD CONSTRAINT presupuesto_detalles_unidad_medida_id_unidades_medida_id_fk FOREIGN KEY (unidad_medida_id) REFERENCES public.unidades_medida(id);


--
-- Name: presupuestos presupuestos_anulado_por_usuarios_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.presupuestos
    ADD CONSTRAINT presupuestos_anulado_por_usuarios_id_fk FOREIGN KEY (anulado_por) REFERENCES public.usuarios(id);


--
-- Name: presupuestos presupuestos_cliente_id_clientes_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.presupuestos
    ADD CONSTRAINT presupuestos_cliente_id_clientes_id_fk FOREIGN KEY (cliente_id) REFERENCES public.clientes(id);


--
-- Name: presupuestos presupuestos_confirmado_por_usuarios_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.presupuestos
    ADD CONSTRAINT presupuestos_confirmado_por_usuarios_id_fk FOREIGN KEY (confirmado_por) REFERENCES public.usuarios(id);


--
-- Name: presupuestos presupuestos_creado_por_usuarios_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.presupuestos
    ADD CONSTRAINT presupuestos_creado_por_usuarios_id_fk FOREIGN KEY (creado_por) REFERENCES public.usuarios(id);


--
-- Name: presupuestos presupuestos_empresa_id_empresas_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.presupuestos
    ADD CONSTRAINT presupuestos_empresa_id_empresas_id_fk FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);


--
-- Name: presupuestos presupuestos_sucursal_id_sucursales_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.presupuestos
    ADD CONSTRAINT presupuestos_sucursal_id_sucursales_id_fk FOREIGN KEY (sucursal_id) REFERENCES public.sucursales(id);


--
-- Name: presupuestos presupuestos_vendedor_id_usuarios_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.presupuestos
    ADD CONSTRAINT presupuestos_vendedor_id_usuarios_id_fk FOREIGN KEY (vendedor_id) REFERENCES public.usuarios(id);


--
-- Name: proveedores proveedores_condicion_pago_id_condiciones_pago_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proveedores
    ADD CONSTRAINT proveedores_condicion_pago_id_condiciones_pago_id_fk FOREIGN KEY (condicion_pago_id) REFERENCES public.condiciones_pago(id);


--
-- Name: proveedores proveedores_empresa_id_empresas_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proveedores
    ADD CONSTRAINT proveedores_empresa_id_empresas_id_fk FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);


--
-- Name: proveedores proveedores_persona_id_personas_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proveedores
    ADD CONSTRAINT proveedores_persona_id_personas_id_fk FOREIGN KEY (persona_id) REFERENCES public.personas(id);


--
-- Name: puntos_expedicion puntos_expedicion_empresa_id_empresas_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.puntos_expedicion
    ADD CONSTRAINT puntos_expedicion_empresa_id_empresas_id_fk FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);


--
-- Name: puntos_expedicion puntos_expedicion_establecimiento_id_establecimientos_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.puntos_expedicion
    ADD CONSTRAINT puntos_expedicion_establecimiento_id_establecimientos_id_fk FOREIGN KEY (establecimiento_id) REFERENCES public.establecimientos(id);


--
-- Name: puntos_expedicion puntos_expedicion_sucursal_id_sucursales_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.puntos_expedicion
    ADD CONSTRAINT puntos_expedicion_sucursal_id_sucursales_id_fk FOREIGN KEY (sucursal_id) REFERENCES public.sucursales(id);


--
-- Name: recepcion_detalles recepcion_detalles_articulo_id_articulos_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recepcion_detalles
    ADD CONSTRAINT recepcion_detalles_articulo_id_articulos_id_fk FOREIGN KEY (articulo_id) REFERENCES public.articulos(id);


--
-- Name: recepcion_detalles recepcion_detalles_detalle_origen_id_factura_compra_detalles_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recepcion_detalles
    ADD CONSTRAINT recepcion_detalles_detalle_origen_id_factura_compra_detalles_id FOREIGN KEY (detalle_origen_id) REFERENCES public.factura_compra_detalles(id);


--
-- Name: recepcion_detalles recepcion_detalles_empresa_id_empresas_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recepcion_detalles
    ADD CONSTRAINT recepcion_detalles_empresa_id_empresas_id_fk FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);


--
-- Name: recepcion_detalles recepcion_detalles_recepcion_id_recepciones_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recepcion_detalles
    ADD CONSTRAINT recepcion_detalles_recepcion_id_recepciones_id_fk FOREIGN KEY (recepcion_id) REFERENCES public.recepciones(id) ON DELETE CASCADE;


--
-- Name: recepcion_detalles recepcion_detalles_sucursal_id_sucursales_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recepcion_detalles
    ADD CONSTRAINT recepcion_detalles_sucursal_id_sucursales_id_fk FOREIGN KEY (sucursal_id) REFERENCES public.sucursales(id);


--
-- Name: recepciones recepciones_anulado_por_usuarios_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recepciones
    ADD CONSTRAINT recepciones_anulado_por_usuarios_id_fk FOREIGN KEY (anulado_por) REFERENCES public.usuarios(id);


--
-- Name: recepciones recepciones_confirmado_por_usuarios_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recepciones
    ADD CONSTRAINT recepciones_confirmado_por_usuarios_id_fk FOREIGN KEY (confirmado_por) REFERENCES public.usuarios(id);


--
-- Name: recepciones recepciones_creado_por_usuarios_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recepciones
    ADD CONSTRAINT recepciones_creado_por_usuarios_id_fk FOREIGN KEY (creado_por) REFERENCES public.usuarios(id);


--
-- Name: recepciones recepciones_deposito_id_depositos_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recepciones
    ADD CONSTRAINT recepciones_deposito_id_depositos_id_fk FOREIGN KEY (deposito_id) REFERENCES public.depositos(id);


--
-- Name: recepciones recepciones_empresa_id_empresas_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recepciones
    ADD CONSTRAINT recepciones_empresa_id_empresas_id_fk FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);


--
-- Name: recepciones recepciones_factura_compra_id_facturas_compra_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recepciones
    ADD CONSTRAINT recepciones_factura_compra_id_facturas_compra_id_fk FOREIGN KEY (factura_compra_id) REFERENCES public.facturas_compra(id);


--
-- Name: recepciones recepciones_sucursal_id_sucursales_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recepciones
    ADD CONSTRAINT recepciones_sucursal_id_sucursales_id_fk FOREIGN KEY (sucursal_id) REFERENCES public.sucursales(id);


--
-- Name: rol_permisos rol_permisos_permiso_id_permisos_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rol_permisos
    ADD CONSTRAINT rol_permisos_permiso_id_permisos_id_fk FOREIGN KEY (permiso_id) REFERENCES public.permisos(id) ON DELETE CASCADE;


--
-- Name: rol_permisos rol_permisos_rol_id_roles_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rol_permisos
    ADD CONSTRAINT rol_permisos_rol_id_roles_id_fk FOREIGN KEY (rol_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: roles roles_empresa_id_empresas_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_empresa_id_empresas_id_fk FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);


--
-- Name: sesiones_caja sesiones_caja_caja_id_cajas_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sesiones_caja
    ADD CONSTRAINT sesiones_caja_caja_id_cajas_id_fk FOREIGN KEY (caja_id) REFERENCES public.cajas(id);


--
-- Name: sesiones_caja sesiones_caja_cerrada_por_usuarios_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sesiones_caja
    ADD CONSTRAINT sesiones_caja_cerrada_por_usuarios_id_fk FOREIGN KEY (cerrada_por) REFERENCES public.usuarios(id);


--
-- Name: sesiones_caja sesiones_caja_empresa_id_empresas_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sesiones_caja
    ADD CONSTRAINT sesiones_caja_empresa_id_empresas_id_fk FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);


--
-- Name: sesiones_caja sesiones_caja_sucursal_id_sucursales_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sesiones_caja
    ADD CONSTRAINT sesiones_caja_sucursal_id_sucursales_id_fk FOREIGN KEY (sucursal_id) REFERENCES public.sucursales(id);


--
-- Name: sesiones_caja sesiones_caja_usuario_id_usuarios_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sesiones_caja
    ADD CONSTRAINT sesiones_caja_usuario_id_usuarios_id_fk FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);


--
-- Name: sifen_eventos sifen_eventos_empresa_id_empresas_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sifen_eventos
    ADD CONSTRAINT sifen_eventos_empresa_id_empresas_id_fk FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);


--
-- Name: sifen_eventos sifen_eventos_factura_venta_id_facturas_venta_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sifen_eventos
    ADD CONSTRAINT sifen_eventos_factura_venta_id_facturas_venta_id_fk FOREIGN KEY (factura_venta_id) REFERENCES public.facturas_venta(id);


--
-- Name: sifen_eventos sifen_eventos_sucursal_id_sucursales_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sifen_eventos
    ADD CONSTRAINT sifen_eventos_sucursal_id_sucursales_id_fk FOREIGN KEY (sucursal_id) REFERENCES public.sucursales(id);


--
-- Name: sifen_eventos sifen_eventos_usuario_id_usuarios_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sifen_eventos
    ADD CONSTRAINT sifen_eventos_usuario_id_usuarios_id_fk FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);


--
-- Name: stock stock_articulo_id_articulos_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock
    ADD CONSTRAINT stock_articulo_id_articulos_id_fk FOREIGN KEY (articulo_id) REFERENCES public.articulos(id);


--
-- Name: stock stock_deposito_id_depositos_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock
    ADD CONSTRAINT stock_deposito_id_depositos_id_fk FOREIGN KEY (deposito_id) REFERENCES public.depositos(id);


--
-- Name: stock stock_empresa_id_empresas_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock
    ADD CONSTRAINT stock_empresa_id_empresas_id_fk FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);


--
-- Name: stock stock_sucursal_id_sucursales_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock
    ADD CONSTRAINT stock_sucursal_id_sucursales_id_fk FOREIGN KEY (sucursal_id) REFERENCES public.sucursales(id);


--
-- Name: sucursales sucursales_ciudad_id_ciudades_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sucursales
    ADD CONSTRAINT sucursales_ciudad_id_ciudades_id_fk FOREIGN KEY (ciudad_id) REFERENCES public.ciudades(id);


--
-- Name: sucursales sucursales_empresa_id_empresas_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sucursales
    ADD CONSTRAINT sucursales_empresa_id_empresas_id_fk FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);


--
-- Name: timbrados timbrados_empresa_id_empresas_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.timbrados
    ADD CONSTRAINT timbrados_empresa_id_empresas_id_fk FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);


--
-- Name: transferencia_stock_detalles transferencia_stock_detalles_articulo_id_articulos_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transferencia_stock_detalles
    ADD CONSTRAINT transferencia_stock_detalles_articulo_id_articulos_id_fk FOREIGN KEY (articulo_id) REFERENCES public.articulos(id);


--
-- Name: transferencia_stock_detalles transferencia_stock_detalles_empresa_id_empresas_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transferencia_stock_detalles
    ADD CONSTRAINT transferencia_stock_detalles_empresa_id_empresas_id_fk FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);


--
-- Name: transferencia_stock_detalles transferencia_stock_detalles_sucursal_id_sucursales_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transferencia_stock_detalles
    ADD CONSTRAINT transferencia_stock_detalles_sucursal_id_sucursales_id_fk FOREIGN KEY (sucursal_id) REFERENCES public.sucursales(id);


--
-- Name: transferencia_stock_detalles transferencia_stock_detalles_transferencia_stock_id_transferenc; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transferencia_stock_detalles
    ADD CONSTRAINT transferencia_stock_detalles_transferencia_stock_id_transferenc FOREIGN KEY (transferencia_stock_id) REFERENCES public.transferencias_stock(id) ON DELETE CASCADE;


--
-- Name: transferencias_stock transferencias_stock_anulado_por_usuarios_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transferencias_stock
    ADD CONSTRAINT transferencias_stock_anulado_por_usuarios_id_fk FOREIGN KEY (anulado_por) REFERENCES public.usuarios(id);


--
-- Name: transferencias_stock transferencias_stock_confirmado_por_usuarios_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transferencias_stock
    ADD CONSTRAINT transferencias_stock_confirmado_por_usuarios_id_fk FOREIGN KEY (confirmado_por) REFERENCES public.usuarios(id);


--
-- Name: transferencias_stock transferencias_stock_creado_por_usuarios_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transferencias_stock
    ADD CONSTRAINT transferencias_stock_creado_por_usuarios_id_fk FOREIGN KEY (creado_por) REFERENCES public.usuarios(id);


--
-- Name: transferencias_stock transferencias_stock_deposito_destino_id_depositos_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transferencias_stock
    ADD CONSTRAINT transferencias_stock_deposito_destino_id_depositos_id_fk FOREIGN KEY (deposito_destino_id) REFERENCES public.depositos(id);


--
-- Name: transferencias_stock transferencias_stock_deposito_origen_id_depositos_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transferencias_stock
    ADD CONSTRAINT transferencias_stock_deposito_origen_id_depositos_id_fk FOREIGN KEY (deposito_origen_id) REFERENCES public.depositos(id);


--
-- Name: transferencias_stock transferencias_stock_empresa_id_empresas_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transferencias_stock
    ADD CONSTRAINT transferencias_stock_empresa_id_empresas_id_fk FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);


--
-- Name: transferencias_stock transferencias_stock_enviado_por_usuarios_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transferencias_stock
    ADD CONSTRAINT transferencias_stock_enviado_por_usuarios_id_fk FOREIGN KEY (enviado_por) REFERENCES public.usuarios(id);


--
-- Name: transferencias_stock transferencias_stock_recibido_por_usuarios_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transferencias_stock
    ADD CONSTRAINT transferencias_stock_recibido_por_usuarios_id_fk FOREIGN KEY (recibido_por) REFERENCES public.usuarios(id);


--
-- Name: transferencias_stock transferencias_stock_sucursal_destino_id_sucursales_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transferencias_stock
    ADD CONSTRAINT transferencias_stock_sucursal_destino_id_sucursales_id_fk FOREIGN KEY (sucursal_destino_id) REFERENCES public.sucursales(id);


--
-- Name: transferencias_stock transferencias_stock_sucursal_id_sucursales_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transferencias_stock
    ADD CONSTRAINT transferencias_stock_sucursal_id_sucursales_id_fk FOREIGN KEY (sucursal_id) REFERENCES public.sucursales(id);


--
-- Name: usuario_roles usuario_roles_rol_id_roles_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuario_roles
    ADD CONSTRAINT usuario_roles_rol_id_roles_id_fk FOREIGN KEY (rol_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: usuario_roles usuario_roles_sucursal_id_sucursales_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuario_roles
    ADD CONSTRAINT usuario_roles_sucursal_id_sucursales_id_fk FOREIGN KEY (sucursal_id) REFERENCES public.sucursales(id);


--
-- Name: usuario_roles usuario_roles_usuario_id_usuarios_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuario_roles
    ADD CONSTRAINT usuario_roles_usuario_id_usuarios_id_fk FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- Name: usuarios usuarios_empresa_id_empresas_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_empresa_id_empresas_id_fk FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);


--
-- Name: usuarios usuarios_sucursal_predeterminada_id_sucursales_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_sucursal_predeterminada_id_sucursales_id_fk FOREIGN KEY (sucursal_predeterminada_id) REFERENCES public.sucursales(id);


--
-- PostgreSQL database dump complete
--

\unrestrict sXQEQJ7nQZe8OPWFJON4LE2Stt0xrC8kCgXVCcxZPRky5J6BsPfv7cUWSffTJpI

