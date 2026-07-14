-- =========================================================================
-- VELORIA - SQL MIGRATION: PRODUCT RATINGS TRIGGER (INSERT, UPDATE, DELETE)
-- This script creates a trigger to automatically update the ratings count
-- and average rating of a product whenever a rating is inserted, updated, or deleted.
-- =========================================================================

-- Create or replace function to update product rating statistics
CREATE OR REPLACE FUNCTION public.update_product_ratings_stats()
RETURNS TRIGGER AS $$
DECLARE
    target_product_id UUID;
    avg_rating NUMERIC(3,2);
    ratings_cnt INTEGER;
BEGIN
    -- Determine the target product_id depending on the operation type
    IF (TG_OP = 'DELETE') THEN
        target_product_id := OLD.product_id;
    ELSE
        target_product_id := NEW.product_id;
    END IF;

    -- Recalculate average and count for the affected product
    SELECT COALESCE(ROUND(AVG(rating)::numeric, 1), 0.0), COUNT(rating)
    INTO avg_rating, ratings_cnt
    FROM public.product_ratings
    WHERE product_id = target_product_id;

    -- Update the product fields (using rating_average and ratings_count)
    UPDATE public.products
    SET rating_average = avg_rating,
        ratings_count = ratings_cnt
    WHERE id = target_product_id;

    -- Return appropriate record for the trigger pipeline
    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop legacy trigger if it exists
DROP TRIGGER IF EXISTS tr_after_insert_product_rating ON public.product_ratings;
DROP TRIGGER IF EXISTS tr_after_product_rating_change ON public.product_ratings;

-- Create trigger to execute after INSERT, UPDATE, or DELETE on product_ratings
CREATE TRIGGER tr_after_product_rating_change
AFTER INSERT OR UPDATE OR DELETE ON public.product_ratings
FOR EACH ROW
EXECUTE FUNCTION public.update_product_ratings_stats();
