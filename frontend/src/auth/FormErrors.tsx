interface FormErrorsProps {
   readonly errors: string[];
}


export default function FormErrors({ errors }: FormErrorsProps) {
   /**
    * @brief Visualizza la lista di errori restituiti dal backend dopo il submit.
    * @param errors string[] Lista di messaggi di errore provenienti dal ViewModel
    * @req RF-OB_04
    */
   if (errors.length === 0) return null;

   return (
      <div className="mb-4 pl-3 py-1">
         {errors.map(err => (
         <p key={err} className="text-sm text-[#972020] m-0">{err}</p>
         ))}
      </div>
   );
}