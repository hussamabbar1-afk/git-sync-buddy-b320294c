-- Remove customer-visible artifacts produced by early appointment quick replies.
update public.messages
set
  content = btrim(regexp_replace(
    content,
    '(Termin|Appointment)[[:space:]_-]*(ID|UUID)[[:space:]]*:?([[:space:]]*)[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}',
    '',
    'gi'
  )),
  customer_visible_content = case
    when customer_visible_content is null then null
    else btrim(regexp_replace(
      customer_visible_content,
      '(Termin|Appointment)[[:space:]_-]*(ID|UUID)[[:space:]]*:?([[:space:]]*)[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}',
      '',
      'gi'
    ))
  end
where content ~* '(Termin|Appointment)[[:space:]_-]*(ID|UUID)[[:space:]]*:?[[:space:]]*[0-9a-f]{8}-'
   or customer_visible_content ~* '(Termin|Appointment)[[:space:]_-]*(ID|UUID)[[:space:]]*:?[[:space:]]*[0-9a-f]{8}-';

update public.messages
set
  content = 'Foto-Upload ausgewählt',
  customer_visible_content = case
    when customer_visible_content is null then null
    else 'Foto-Upload ausgewählt'
  end
where btrim(lower(content)) in ('upload_photo', '__action_upload_photo')
   or btrim(lower(coalesce(customer_visible_content, ''))) in (
     'upload_photo', '__action_upload_photo'
   );
