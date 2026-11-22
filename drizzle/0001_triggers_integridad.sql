-- Integridad no expresable con CHECK: partida doble a nivel de líneas y tablas append-only.

-- 1) Partida doble: un asiento CONFIRMADO debe tener >= 2 líneas y
--    sum(debe) = sum(haber) = total_debe_gs = total_haber_gs.
--    Trigger de restricción DIFERIDO: se valida al COMMIT, por lo que el backend puede
--    insertar cabecera + líneas en cualquier orden dentro de la misma transacción.
CREATE OR REPLACE FUNCTION fn_validar_partida_doble() RETURNS trigger
LANGUAGE plpgsql AS $$
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
--> statement-breakpoint
CREATE CONSTRAINT TRIGGER trg_detalles_asiento_partida_doble
  AFTER INSERT OR UPDATE OR DELETE ON detalles_asiento_contable
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION fn_validar_partida_doble();
--> statement-breakpoint
CREATE CONSTRAINT TRIGGER trg_asientos_partida_doble
  AFTER INSERT OR UPDATE ON asientos_contables
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION fn_validar_partida_doble();
--> statement-breakpoint

-- 2) Tablas append-only: kardex, historico_costos, sifen_eventos.
CREATE OR REPLACE FUNCTION fn_append_only() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'La tabla % es append-only: % no permitido', TG_TABLE_NAME, TG_OP
    USING ERRCODE = 'restrict_violation';
END;
$$;
--> statement-breakpoint
CREATE TRIGGER trg_kardex_append_only
  BEFORE UPDATE OR DELETE ON kardex
  FOR EACH ROW EXECUTE FUNCTION fn_append_only();
--> statement-breakpoint
CREATE TRIGGER trg_historico_costos_append_only
  BEFORE UPDATE OR DELETE ON historico_costos
  FOR EACH ROW EXECUTE FUNCTION fn_append_only();
--> statement-breakpoint
CREATE TRIGGER trg_sifen_eventos_append_only
  BEFORE UPDATE OR DELETE ON sifen_eventos
  FOR EACH ROW EXECUTE FUNCTION fn_append_only();
--> statement-breakpoint

-- 3) Documentos confirmados/anulados no se borran físicamente.
CREATE OR REPLACE FUNCTION fn_prohibir_borrado_confirmado() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.estado::text <> 'borrador' THEN
    RAISE EXCEPTION 'No se puede eliminar % id=% en estado %; use anulación', TG_TABLE_NAME, OLD.id, OLD.estado
      USING ERRCODE = 'restrict_violation';
  END IF;
  RETURN OLD;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER trg_pedidos_compra_no_borrar BEFORE DELETE ON pedidos_compra
  FOR EACH ROW EXECUTE FUNCTION fn_prohibir_borrado_confirmado();
--> statement-breakpoint
CREATE TRIGGER trg_ordenes_compra_no_borrar BEFORE DELETE ON ordenes_compra
  FOR EACH ROW EXECUTE FUNCTION fn_prohibir_borrado_confirmado();
--> statement-breakpoint
CREATE TRIGGER trg_facturas_compra_no_borrar BEFORE DELETE ON facturas_compra
  FOR EACH ROW EXECUTE FUNCTION fn_prohibir_borrado_confirmado();
--> statement-breakpoint
CREATE TRIGGER trg_recepciones_no_borrar BEFORE DELETE ON recepciones
  FOR EACH ROW EXECUTE FUNCTION fn_prohibir_borrado_confirmado();
--> statement-breakpoint
CREATE TRIGGER trg_ordenes_pago_no_borrar BEFORE DELETE ON ordenes_pago
  FOR EACH ROW EXECUTE FUNCTION fn_prohibir_borrado_confirmado();
--> statement-breakpoint
CREATE TRIGGER trg_presupuestos_no_borrar BEFORE DELETE ON presupuestos
  FOR EACH ROW EXECUTE FUNCTION fn_prohibir_borrado_confirmado();
--> statement-breakpoint
CREATE TRIGGER trg_facturas_venta_no_borrar BEFORE DELETE ON facturas_venta
  FOR EACH ROW EXECUTE FUNCTION fn_prohibir_borrado_confirmado();
--> statement-breakpoint
CREATE TRIGGER trg_cobros_no_borrar BEFORE DELETE ON cobros
  FOR EACH ROW EXECUTE FUNCTION fn_prohibir_borrado_confirmado();
--> statement-breakpoint
CREATE TRIGGER trg_ajustes_stock_no_borrar BEFORE DELETE ON ajustes_stock
  FOR EACH ROW EXECUTE FUNCTION fn_prohibir_borrado_confirmado();
--> statement-breakpoint
CREATE TRIGGER trg_transferencias_stock_no_borrar BEFORE DELETE ON transferencias_stock
  FOR EACH ROW EXECUTE FUNCTION fn_prohibir_borrado_confirmado();
--> statement-breakpoint
CREATE TRIGGER trg_asientos_contables_no_borrar BEFORE DELETE ON asientos_contables
  FOR EACH ROW EXECUTE FUNCTION fn_prohibir_borrado_confirmado();
