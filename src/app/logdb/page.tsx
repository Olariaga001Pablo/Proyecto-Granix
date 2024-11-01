'use client';

import React, { useState, useEffect, ChangeEvent } from 'react';
import { openDB } from 'idb';
import {setUpDataBase, eliminarBaseDeDatosCompleta} from '../../lib/indexedDB'
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
// import { useRouter } from 'next/navigation';

import { error } from 'console';
// import {CrearRuta} from '../crearruta/page'
import { useVendedor } from '@/lib/vendedorContext';


async function MirarVendedores(){
  const db = await setUpDataBase();
  const tx = db.transaction('Vendedor','readonly');
  // console.log(tx.store) 
  const vendedores = await tx.store.getAll(); // Obtiene todos los vendedores
  // console.log(vendedores)
  tx.done;             

  // Para eliminar el primer id del vendedor
  // const tx = db.transaction('Vendedor','readwrite');
  //await tx.store.delete(1)
}

export async function guardarVendedorLocal(vendedor: any){
  try{
    const db = await setUpDataBase();
    const tx = db.transaction('Vendedor','readwrite');
    await tx.store.put(vendedor);
    await tx.done

    console.log('Vendedor guardado localmente');
  }catch(error){
    console.error('Error al guardar el vendedor',error)
  }
}

const TestConnectionButton = () => {
  const [isTesting, setIsTesting] = useState(false);

  const testConnection = async () => {
    if (isTesting) return;
    
    setIsTesting(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id',37)
        .limit(10);
      console.log(data)
      if (error) {
        console.error('Error de conexión:', error);
        alert('Error al conectar con Supabase: ' + error.message);
      } else {
        console.log('Conexión exitosa');
        alert('Conexión exitosa con Supabase!');
      }
    } catch (err ) {
      if ( err instanceof Error){
        alert('Error: ' + err.message);
      }
      console.error('Error:', err);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <button 
      onClick={testConnection}
      disabled={isTesting}
      className="mt-4 bg-green-500 text-white p-2 rounded hover:bg-green-600 disabled:bg-gray-400"
    >
      {isTesting ? 'Probando...' : 'Probar Conexión'}
    </button>
  );
};

interface Vendedor{
  numero : number,
  clave : string
}


const login = async(numero : any , clave : any) => {
  try {
      const {data: vendedorbext , error} = await supabase
      .from('vendedores')
      .select('*')
      .eq('numero',numero)
      .eq('clave',clave)
      .single();

      //console.log('Número:', numero);
      //console.log('Clave:', clave);
      //console.log(vendedor)

      if (error) throw error;
      if (vendedorbext){
          const vendedorl = {
            numero: vendedorbext.numero,
            sincronizado: true,
            clave: vendedorbext.clave,
          }
          // setVendedorId(vendedorbext.numero)
          //setVendedor(vendedorbext.numero);

      //setVendedorId(vendedorbext.numero); // Cambia esto a vendedorId si es necesario

      await guardarVendedorLocal(vendedorl);

      //eliminarBaseDeDatosCompleta();
      MirarVendedores();
      return vendedorbext;
    }
  }catch(error){
    console.error('Error durante el login', error);
    alert('Ocurrió un erorr al iniciar sesión');
    
  }

}


const OfflineFirstForm: React.FC = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    //vendedor_id: '',
    numero: '',
    clave: ''
  });
  const { setVendedorId } = useVendedor();
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  // const [lastSync, setLastSync] = useState(null);
  // const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);

  

  
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    if (sessionStorage.getItem('isLoggedIn') === 'true') {
      router.push('/crearruta'); // Redirige a CrearRuta
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [router]);

  const handleInputChange = (e : ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const saveData = async (e : React.FormEvent) => {
    e.preventDefault();
    
    const now = new Date().toISOString();
    const data = { 
      numero: Number(formData.numero), // Asegúrate de que sea un número
      clave : formData.clave,
      // email: formData.email,
      //created_at: now,
      //sincronizado: false
    };

    try {
      const vendedor = await login(data.numero,data.clave);
      console.log(vendedor)
      if (vendedor){
        setVendedorId(vendedor.numero); // Establecer el ID del vendedor

        alert('Datos guardados correctamente')
        setFormData({numero : '', clave: ''});
        //setIsLoggedIn(true)
        sessionStorage.setItem('isLoggedIn', 'true');
        router.push('/crearruta');
      }
    } catch (error) {
      if (error instanceof Error) { 
        alert('Error al guardar los datos: ' + error.message);
      }
      console.error('Error al guardar datos:', error);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Formulario Offline-First con Supabase</h2>
      <form onSubmit={saveData} className="space-y-4">
        <div>
          <label htmlFor="numero" className="block mb-1">Número:</label>
          <input
            type="text"
            id="numero"
            name="numero"
            value={formData.numero}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div>
          <label htmlFor="clave" className="block mb-1">Clave:</label>
          <input
            type="password"
            id="clave"
            name="clave"
            value={formData.clave}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        
        <button 
          type="submit" 
          className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
          disabled={isSyncing}
        >
          {isSyncing ? 'Sincronizando...' : 'Guardar'}
        </button>
      </form>
        
      <p className="mt-4">
        Estado: <span className={`font-bold ${isOnline ? 'text-green-500' : 'text-red-500'}`}>
          {isOnline ? 'En línea' : 'Fuera de línea'}
        </span>
      </p>
      <TestConnectionButton />
    </div>
  );
};

export default OfflineFirstForm;