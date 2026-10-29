import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'

import { recipeDeleteMutationOptions, recipeQueryOptions } from './recipes-queries'

interface RecipeDeleteButtonProps {
  recipeId: string
  name: string
}

export function RecipeDeleteButton({ recipeId, name }: RecipeDeleteButtonProps) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const mutation = useMutation(recipeDeleteMutationOptions(recipeId))

  function handleDelete() {
    mutation.mutate(undefined, {
      onSuccess: () => {
        setOpen(false)
        toast.add({ type: 'success', title: 'Recipe deleted' })
        // Navigate first: the recipe page stays on screen while the list loads, and would fetch
        // a removed query again
        void navigate({ to: '/recipes' }).then(() =>
          queryClient.removeQueries({ queryKey: recipeQueryOptions(recipeId).queryKey }),
        )
      },
    })
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        // A dialog closed mid-request would hide whether the recipe is gone
        if (!mutation.isPending) setOpen(next)
      }}
    >
      <AlertDialogTrigger render={<Button variant='destructive' />}>Delete</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this recipe?</AlertDialogTitle>
          <AlertDialogDescription>{`“${name}” will be deleted. You can’t undo this.`}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={mutation.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant='destructive'
            pending={mutation.isPending}
            onClick={handleDelete}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
