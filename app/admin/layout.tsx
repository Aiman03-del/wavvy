import AdminLayoutClient from '@/components/ui/AdminLayoutClient'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>
}
