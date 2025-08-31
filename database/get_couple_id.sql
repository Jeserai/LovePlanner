-- 查询现有的情侣关系ID
SELECT 
  id as couple_id,
  user1_id,
  user2_id,
  created_at
FROM couples 
WHERE is_active = true
  AND (
    user1_id = '6ec5465b-05c7-4f1e-8efd-ed487d785364' OR
    user2_id = '6ec5465b-05c7-4f1e-8efd-ed487d785364' OR
    user1_id = 'f58b5791-c5f8-4d47-97eb-68f32d0e21f2' OR
    user2_id = 'f58b5791-c5f8-4d47-97eb-68f32d0e21f2'
  )
ORDER BY created_at DESC
LIMIT 1;
