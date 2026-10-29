import { Empty } from '@/components/ui/empty'
import { Spinner } from '@/components/ui/spinner'

export function RoutePending() {
  return (
    <div className='flex flex-1'>
      <Empty>
        <Spinner />
      </Empty>
    </div>
  )
}
