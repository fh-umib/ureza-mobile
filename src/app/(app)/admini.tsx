import { EkraniMeHero } from "@/components/EkraniMeHero";
import { SeShpejti } from "@/components/SeShpejti";
import { useProfili } from "@/lib/profili";

// The Admin's home (design: Admin paneli). The panel itself comes in a later step.
export default function Paneli() {
  const { profili } = useProfili();

  return (
    <EkraniMeHero kicker="ADMIN" title="Paneli" subtitle={profili?.emri ? `${profili.emri} · ekipi i Urëzës` : "Ekipi i Urëzës"}>
      <SeShpejti
        titulli="Paneli, harta dhe rastet e kundërshtuara"
        teksti="Statistikat, menaxhimi i Mikut dhe rastet e kundërshtuara me GPS vijnë me hapat e ardhshëm."
      />
    </EkraniMeHero>
  );
}
