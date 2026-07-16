-- Sports Way Trading — Supabase (Postgres) schema reference
-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.profiles (
  id uuid NOT NULL,
  email text NOT NULL UNIQUE,
  name text NOT NULL DEFAULT ''::text,
  phone text NOT NULL DEFAULT ''::text,
  billing_address text NOT NULL DEFAULT ''::text,
  shipping_address text NOT NULL DEFAULT ''::text,
  role text NOT NULL DEFAULT 'customer'::text CHECK (role = ANY (ARRAY['customer'::text, 'admin'::text, 'superadmin'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  last_login timestamp with time zone NOT NULL DEFAULT now(),
  terms_accepted boolean NOT NULL DEFAULT false,
  marketing_opt_in boolean NOT NULL DEFAULT false,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);

CREATE TABLE public.products (
  id bigint NOT NULL,
  name text NOT NULL,
  category text NOT NULL,
  categories ARRAY NOT NULL DEFAULT '{}'::text[],
  price numeric NOT NULL DEFAULT 0,
  old_price numeric,
  stock_status text NOT NULL DEFAULT 'instock'::text CHECK (stock_status = ANY (ARRAY['instock'::text, 'outofstock'::text, 'onbackorder'::text])),
  stock_count integer,
  badge text NOT NULL DEFAULT ''::text,
  img text NOT NULL DEFAULT ''::text,
  image text NOT NULL DEFAULT ''::text,
  img_hover text NOT NULL DEFAULT ''::text,
  cover text NOT NULL DEFAULT ''::text,
  gallery ARRAY NOT NULL DEFAULT '{}'::text[],
  short_desc text NOT NULL DEFAULT ''::text,
  description text NOT NULL DEFAULT ''::text,
  featured boolean NOT NULL DEFAULT false,
  rating numeric NOT NULL DEFAULT 5,
  reviews integer NOT NULL DEFAULT 0,
  variations jsonb NOT NULL DEFAULT '[]'::jsonb,
  attributes jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  slug text UNIQUE,
  brand text NOT NULL DEFAULT ''::text,
  dolibarr_id integer UNIQUE,
  dolibarr_ref text,
  CONSTRAINT products_pkey PRIMARY KEY (id)
  -- dolibarr_id/dolibarr_ref: set once an admin links this product to a Dolibarr
  -- product via FastAPI. stock_count/stock_status are then a cache of Dolibarr's
  -- stock_reel, refreshed by the backend — Dolibarr remains the source of truth.
);

CREATE TABLE public.site_settings (
  key text NOT NULL,
  value jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT site_settings_pkey PRIMARY KEY (key)
  -- Generic KV store used for: hidden_categories, hidden_subcategories, saved_attributes,
  -- product_brands, custom_categories, show_brands_filter, site_clients, site_partners, site_blogs
);

CREATE TABLE public.cart_items (
  user_id uuid NOT NULL,
  cart_id text NOT NULL,
  product_id bigint NOT NULL,
  name text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  image text NOT NULL DEFAULT ''::text,
  qty integer NOT NULL CHECK (qty > 0),
  category text NOT NULL DEFAULT ''::text,
  categories ARRAY NOT NULL DEFAULT '{}'::text[],
  variation jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT cart_items_pkey PRIMARY KEY (user_id, cart_id),
  CONSTRAINT cart_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT cart_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);

CREATE TABLE public.wishlist_items (
  user_id uuid NOT NULL,
  product_id bigint NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT wishlist_items_pkey PRIMARY KEY (user_id, product_id),
  CONSTRAINT wishlist_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT wishlist_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);

CREATE TABLE public.coupons (
  code text NOT NULL,
  discount_type text NOT NULL DEFAULT 'percentage'::text CHECK (discount_type = ANY (ARRAY['percentage'::text, 'fixed_cart'::text, 'fixed_product'::text])),
  discount numeric NOT NULL DEFAULT 0,
  limit_per_coupon integer,
  limit_per_items integer,
  limit_per_user integer,
  specific_products ARRAY NOT NULL DEFAULT '{}'::text[],
  used_count integer NOT NULL DEFAULT 0,
  user_uses jsonb NOT NULL DEFAULT '{}'::jsonb,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT coupons_pkey PRIMARY KEY (code)
);

CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id text NOT NULL UNIQUE,
  user_id uuid,
  customer_name text NOT NULL DEFAULT ''::text,
  email text NOT NULL DEFAULT ''::text,
  phone text NOT NULL DEFAULT ''::text,
  total numeric NOT NULL DEFAULT 0,
  subtotal numeric NOT NULL DEFAULT 0,
  shipping numeric NOT NULL DEFAULT 0,
  discount numeric NOT NULL DEFAULT 0,
  coupon_code text,
  payment_method text NOT NULL DEFAULT ''::text,
  status text NOT NULL DEFAULT 'Processing'::text,
  notes text NOT NULL DEFAULT ''::text,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  address text NOT NULL DEFAULT ''::text,
  dolibarr_order_id text,
  dolibarr_invoice_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT orders_coupon_code_fkey FOREIGN KEY (coupon_code) REFERENCES public.coupons(code)
  -- dolibarr_order_id/dolibarr_invoice_id: set later once an order is pushed
  -- into Dolibarr for fulfillment. Each line in `items` already carries its
  -- own productId (website) and dolibarrId/dolibarrRef (Dolibarr product).
);

-- Storage: bucket "product-images" (see SUPABASE_STORAGE_BUCKET in src/lib/supabase.js)
-- holds product photos + a generated sitemap.xml
