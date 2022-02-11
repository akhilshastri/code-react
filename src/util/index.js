

export async function getData(){
  const response = await fetch('/customers.json')
    return await response.json();
}
