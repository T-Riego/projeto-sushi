type DemoNoticeProps = {
  className?: string
}

const noticeText =
  'Simulação para portfólio — nenhum pedido ou reserva será realizado e nenhum dado será enviado.'

export function DemoNotice({ className }: DemoNoticeProps) {
  const classes = ['demo-notice', className].filter(Boolean).join(' ')

  return (
    <aside className={classes} role="note">
      {noticeText}
    </aside>
  )
}
