
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.31.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the Admin key
    const supabaseAdmin = createClient(
      // Supabase API URL - env var exported by default when deployed to Supabase
      Deno.env.get('SUPABASE_URL') ?? '',
      // Supabase SERVICE_ROLE KEY - env var exported by default when deployed to Supabase
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Sample inventory data
    const inventoryData = [
      {
        brand: "Kajaria",
        tile_width: 600,
        tile_height: 600,
        tiles_per_box: 4,
        boxes_on_hand: 120,
        price_per_sqft: 65
      },
      {
        brand: "Somany",
        tile_width: 300,
        tile_height: 600,
        tiles_per_box: 8,
        boxes_on_hand: 85,
        price_per_sqft: 55
      },
      {
        brand: "Johnson",
        tile_width: 800,
        tile_height: 800,
        tiles_per_box: 3,
        boxes_on_hand: 45,
        price_per_sqft: 95
      },
      {
        brand: "Nitco",
        tile_width: 300,
        tile_height: 300,
        tiles_per_box: 11,
        boxes_on_hand: 75,
        price_per_sqft: 48
      },
      {
        brand: "Bajaj",
        tile_width: 200,
        tile_height: 1200,
        tiles_per_box: 6,
        boxes_on_hand: 62,
        price_per_sqft: 72
      }
    ];

    // Check if inventory already contains data
    const { count: inventoryCount } = await supabaseAdmin
      .from('inventory')
      .select('*', { count: 'exact', head: true });

    // Only insert if no data exists
    if (inventoryCount === 0) {
      // Insert inventory data
      const { error: inventoryError } = await supabaseAdmin
        .from('inventory')
        .insert(inventoryData);

      if (inventoryError) {
        console.error('Error inserting inventory data:', inventoryError);
        throw inventoryError;
      }
      
      console.log('Successfully inserted inventory data');
    } else {
      console.log('Inventory data already exists, skipping insertion');
    }

    // Check if inventory has data now (needed for orders)
    const { data: inventoryItems } = await supabaseAdmin
      .from('inventory')
      .select('*');

    if (inventoryItems && inventoryItems.length > 0) {
      // Check if orders already contain data
      const { count: ordersCount } = await supabaseAdmin
        .from('orders')
        .select('*', { count: 'exact', head: true });

      if (ordersCount === 0) {
        // Sample orders data (using actual inventory IDs)
        const ordersData = [
          {
            client_name: "Sharma Construction",
            client_phone: "9876543210",
            client_address: "123 Main Street, Mumbai",
            client_gst: "27AABCS1429B1Z1",
            vehicle_no: "MH-01-AB-1234",
            is_reverse_charge: false,
            eway_bill: "EWB12345678",
            order_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
            hsn_code: "6907",
            state_code: "27"
          },
          {
            client_name: "Patel Interiors",
            client_phone: "8765432109",
            client_address: "456 Park Avenue, Delhi",
            client_gst: "07AAACO0305J1ZJ",
            vehicle_no: "DL-01-CD-5678",
            is_reverse_charge: true,
            eway_bill: null,
            order_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
            hsn_code: "6907",
            state_code: "07"
          },
          {
            client_name: "Kumar Builders",
            client_phone: "7654321098",
            client_address: "789 Lake Road, Bangalore",
            client_gst: "29AABCK9765R1ZS",
            vehicle_no: "KA-01-EF-9012",
            is_reverse_charge: false,
            eway_bill: "EWB98765432",
            order_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
            hsn_code: "6907",
            state_code: "29"
          }
        ];

        // Insert order data and capture IDs
        for (const order of ordersData) {
          const { data: newOrder, error: orderError } = await supabaseAdmin
            .from('orders')
            .insert(order)
            .select()
            .single();

          if (orderError) {
            console.error('Error inserting order:', orderError);
            continue;
          }

          // Choose random products from inventory for this order
          const orderItems = [];
          const numItems = Math.floor(Math.random() * 3) + 1; // 1-3 items per order
          
          // Create a copy of inventory IDs to select from
          const availableProducts = [...inventoryItems];
          
          for (let i = 0; i < numItems && availableProducts.length > 0; i++) {
            // Pick a random product
            const randomIndex = Math.floor(Math.random() * availableProducts.length);
            const product = availableProducts[randomIndex];
            
            // Remove the chosen product to avoid duplicates
            availableProducts.splice(randomIndex, 1);
            
            // Add order item
            orderItems.push({
              order_id: newOrder.order_id,
              product_id: product.product_id,
              boxes_sold: Math.floor(Math.random() * 10) + 5, // 5-15 boxes
              price_per_sqft: product.price_per_sqft
            });
          }

          // Insert order items
          if (orderItems.length > 0) {
            const { error: itemsError } = await supabaseAdmin
              .from('order_items')
              .insert(orderItems);

            if (itemsError) {
              console.error('Error inserting order items:', itemsError);
            }
          }
        }
        
        console.log('Successfully inserted orders data');
      } else {
        console.log('Orders data already exists, skipping insertion');
      }
    }

    return new Response(
      JSON.stringify({ message: "Demo data setup complete" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in setup-demo-data function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
