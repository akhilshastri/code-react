
// load initial data
export async function loadData(){
    const resp = await fetch("/customers.json");
    return await resp.json();
}
