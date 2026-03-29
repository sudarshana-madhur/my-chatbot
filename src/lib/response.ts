export const errorResponse = (data: Record<string, unknown>) => {
    return new Response(JSON.stringify({ 
        status: "error",
        data
    
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
}

export const successResponse = (data: Record<string, unknown>) => {
    return new Response(JSON.stringify({ 
        status: "success",
        data
    
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
}