import { restaurant } from '../../data/restaurant'

const dayLabels = {
  segunda: 'Segunda',
  terça: 'Terça',
  quarta: 'Quarta',
  quinta: 'Quinta',
  sexta: 'Sexta',
  sábado: 'Sábado',
  domingo: 'Domingo',
} as const

export function LocationSection() {
  return (
    <section
      id="localizacao"
      className="flow-location-section"
      aria-labelledby="location-title"
    >
      <div className="flow-location-inner wrap">
        <div className="flow-location-intro">
          <div className="eyebrow">04 — ONDE A MESA NOS ENCONTRA</div>
          <h2 id="location-title">
            AYORUME Savassi,
            <br />
            no ritmo de <em>Belo Horizonte.</em>
          </h2>
          <address>
            {restaurant.address}
            <span>Endereço fictício</span>
          </address>
          <p>
            Esta unidade existe apenas como parte do projeto de portfólio. O
            mapa abaixo é uma composição gráfica, sem localização real.
          </p>
        </div>

        <div
          className="flow-location-map"
          data-graphic-map
          aria-hidden="true"
        >
          <span className="flow-location-map-line flow-location-map-line-one" />
          <span className="flow-location-map-line flow-location-map-line-two" />
          <span className="flow-location-map-line flow-location-map-line-three" />
          <span className="flow-location-map-node flow-location-map-node-one" />
          <span className="flow-location-map-node flow-location-map-node-two" />
          <span className="flow-location-map-pin">A</span>
          <span className="flow-location-map-label">SAVASSI · BH</span>
          <span className="flow-location-map-japanese" lang="ja" aria-hidden="true">
            場所
          </span>
        </div>

        <div className="flow-location-details">
          <div className="flow-location-hours">
            <h3>Horários</h3>
            <dl>
              {restaurant.openingHours.map((hours) => (
                <div key={hours.day}>
                  <dt>{dayLabels[hours.day]}</dt>
                  <dd>
                    {'closed' in hours
                      ? 'Fechado'
                      : `${hours.opens} — ${hours.closes}`}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="flow-location-delivery">
            <h3>Entrega demonstrativa</h3>
            <p>Raio demonstrativo de 8 km a partir da unidade fictícia.</p>
            <ul aria-label="Bairros atendidos na simulação">
              {restaurant.deliveryNeighborhoods.map((neighborhood) => (
                <li key={neighborhood}>{neighborhood}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
