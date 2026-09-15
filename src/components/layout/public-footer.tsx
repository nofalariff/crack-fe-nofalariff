import Link from "next/link"

import { Logo } from "@/components/shared/logo"
import { ORIGIN } from "@/lib/constants/service-type"

export function PublicFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-muted/30 mt-auto border-t">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3">
          <Logo />
          <p className="text-muted-foreground text-sm">
            Jasa pengiriman kargo udara dari {ORIGIN.name} ({ORIGIN.code}) ke
            Sulawesi dan seluruh Pulau Jawa.
          </p>
        </div>

        <div>
          <h2 className="text-sm font-semibold">Layanan</h2>
          <ul className="text-muted-foreground mt-3 space-y-2 text-sm">
            <li>
              <Link href="/layanan" className="hover:text-foreground">
                Port to Port
              </Link>
            </li>
            <li>
              <Link href="/layanan" className="hover:text-foreground">
                Port to Door
              </Link>
            </li>
            <li>
              <Link href="/cek-ongkir" className="hover:text-foreground">
                Cek Ongkir
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold">Informasi</h2>
          <ul className="text-muted-foreground mt-3 space-y-2 text-sm">
            <li>
              <Link href="/syarat-ketentuan" className="hover:text-foreground">
                Syarat & Ketentuan
              </Link>
            </li>
            <li>
              <Link
                href="/syarat-ketentuan#barang-terlarang"
                className="hover:text-foreground"
              >
                Barang Terlarang
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold">Gudang</h2>
          <address className="text-muted-foreground mt-3 text-sm not-italic">
            Counter Kargo {ORIGIN.name}
            <br />
            {ORIGIN.city}, Banten
            <br />
            Senin–Sabtu, 08.00–17.00 WIB
          </address>
        </div>
      </div>

      <div className="border-t">
        <p className="text-muted-foreground mx-auto w-full max-w-6xl px-4 py-4 text-xs">
          © {year} LogiSend. Seluruh hak cipta dilindungi.
        </p>
      </div>
    </footer>
  )
}
